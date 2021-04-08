#include "workflow_manager.h"

#include <random>
#include <iostream>

namespace wrench {

    // Struct to hold information on tracefile jobs to be added in
    struct TraceFileJobInfo {
        int nodes;
        double flops;
        wrench::WorkflowTask* task;
    };

    /**
     * @brief Construct a new Workflow Manager object
     * 
     * @param compute_services Set of pointers representative of compute services.
     * @param storage_services Set of pointers representative of storage.
     * @param hostname String containing the name of the simulated computer.
     * @param node_count Integer value holding the number of nodes the computer has.
     * @param core_count Integer value holding the number of cores per node.
     */
    WorkflowManager::WorkflowManager(
        const std::set<std::shared_ptr<ComputeService>> &compute_services,
        const std::set<std::shared_ptr<StorageService>> &storage_services,
        const std::string &hostname,
        const int node_count,
        const int core_count) : 
        node_count(node_count), core_count(core_count), WMS(
            nullptr, nullptr,
            compute_services,
            storage_services,
            {}, nullptr,
            hostname,
            "WorkflowManager"
        ) { }
    
    /**
     * @brief Overridden main within WMS to handle the how jobs are processed. 
     * 
     * @return int Default return value
     */
    int WorkflowManager::main()
    {
        this->job_manager = this->createJobManager();

        auto batch_service = *(this->getAvailableComputeServices<BatchComputeService>().begin());

        // Main loop handling the WMS implementation.
        while(true)
        {
            // Add tasks onto the job_manager so it can begin processing them
            while (!this->toSubmitJobs.empty()) 
            {
                // Retrieves the job to be submitted and set up needed arguments.
                auto to_submit = this->toSubmitJobs.front();
                auto job = std::get<0>(to_submit);      
                auto service_specific_args = std::get<1>(to_submit);

                // Submit the job.
                job_manager->submitJob(job, batch_service, service_specific_args);

                // Lock the queue otherwise deadlocks might occur.
                queue_mutex.lock();
                this->toSubmitJobs.pop();
                queue_mutex.unlock();
                std::printf("Submit Server Time: %f\n", this->simulation->getCurrentSimulatedDate());
            }

            // Clean up memory by removing completed and failed jobs
            while(not doneJobs.empty())
                doneJobs.pop();

            // Cancel jobs
            while(not cancelJobs.empty())
            {
                // Retrieve compute service and job to execute job termination.
                auto batch_service = *(this->getAvailableComputeServices<BatchComputeService>().begin());
                auto job_name = cancelJobs.front();
                batch_service->terminateJob(job_list[job_name]);

                // Remove from the map list of jobs
                job_list.erase(job_name);

                // Lock the queue otherwise deadlocks might occur.
                queue_mutex.lock();
                cancelJobs.pop();
                queue_mutex.unlock();
            }

            // Moves time forward for requested time while adding any completed events to a queue.
            // Needs to be done this way because waiting for next event cannot be done on another thread.
            while(this->simulation->getCurrentSimulatedDate() < server_time)
            {
                // Retrieve event by going through very tiny time increments.
                auto event = this->waitForNextEvent(0.01);

                // Checks if there was a job event during the time period
                if(event != nullptr)
                {
                    std::printf("Event Server Time: %f\n", this->simulation->getCurrentSimulatedDate());
                    std::printf("Event: %s\n", event->toString().c_str());
                    // Add job onto the event queue with locks to prevent deadlocks.
                    queue_mutex.lock();
                    events.push(std::make_pair(this->simulation->getCurrentSimulatedDate(), event));
                    queue_mutex.unlock();
                }
            }

            // Exits if server needs to stop
            if(stop)
                break;
        }
        return 0;
    }

    /**
     * @brief Sets the flag to stop the server since the web server and wms server run on two different threads.
     */
    void WorkflowManager::stopServer()
    {
        stop = true;
    }

    std::string WorkflowManager::addJob(const std::string& job_name, const double& duration,
                                  const unsigned int& num_nodes)
    {
        if(num_nodes > node_count)
            return "";
        // Create tasks and add to workflow.
        auto task = this->getWorkflow()->addTask(
            job_name + "_task_" + std::to_string(server_time), duration, 1, 1, 0.0);
        
        // Create a job
        auto job = job_manager->createStandardJob(task, {});

        std::map<std::string, std::string> service_specific_args;
        service_specific_args["-t"] = std::to_string(duration);
        service_specific_args["-N"] = std::to_string(num_nodes);
        service_specific_args["-c"] = std::to_string(1);
        service_specific_args["-u"] = "slurm_user";

        queue_mutex.lock();
        toSubmitJobs.push(std::make_pair(job, service_specific_args));
        queue_mutex.unlock();
        job_list[job->getName()] = job;
        return job->getName();
    }

    bool WorkflowManager::cancelJob(const std::string& job_name)
    {
        if(job_list[job_name] != nullptr)
        {
            queue_mutex.lock();
            cancelJobs.push(job_name);
            queue_mutex.unlock();
            return true;
        }
        return false;
    }

    void WorkflowManager::getEventStatuses(std::queue<std::string>& statuses, const time_t& time)
    {
        // Keeps retrieving events while there are events and converts them to a string(temp) to return
        // to client.
        while(!events.empty())
        {
            queue_mutex.lock();
            auto event = events.front();
            std::shared_ptr<wrench::StandardJob> job;

            // Cleans up by pushing done/failed jobs onto a queue for main thread to clean up.
            if(auto failed = std::dynamic_pointer_cast<wrench::StandardJobFailedEvent>(event.second))
            {
                doneJobs.push(failed->standard_job);
                job = failed->standard_job;
            }
            else if(auto complete = std::dynamic_pointer_cast<wrench::StandardJobCompletedEvent>(event.second))
            {
                doneJobs.push(complete->standard_job);
                job = complete->standard_job;
            }

            // Check if jobs are ones submitted by user otherwise do not return anything to user.
            if(job_list[job->getName()])
            {
                statuses.push(std::to_string(event.first) + " " + event.second->toString());
                job_list.erase(job->getName());
            }
            events.pop();

            queue_mutex.unlock();
        }        
        server_time = time;
    }

    std::vector<std::string> WorkflowManager::get_queue()
    {
        std::vector<std::tuple<std::string,std::string,int,int,int,double,double>> i_queue;
        std::vector<std::string> queue;
        auto batch_services = this->getAvailableComputeServices<BatchComputeService>();
        for(auto const bs : batch_services)
        {
            auto bs_queue = bs->getQueue();
            i_queue.insert(i_queue.end(), bs_queue.begin(), bs_queue.end());
        }
        for(auto const q : i_queue)
            queue.push_back(std::get<0>(q) + ',' + std::get<1>(q) + ',' + std::to_string(std::get<2>(q)) +
                ',' + std::to_string(std::get<4>(q)) + ',' + std::to_string(std::get<6>(q)));
        return queue;
    }
}

