#include "workflow_manager.h"

#include <random>
#include <iostream>

// TODO: Add a mutex around the queue because standard library queues are not thread-safe
namespace wrench {

    WorkflowManager::WorkflowManager(
        const std::set<std::shared_ptr<ComputeService>> &compute_services,
        const std::set<std::shared_ptr<StorageService>> &storage_services,
        const std::string &hostname) : WMS(
            nullptr, nullptr,
            compute_services,
            storage_services,
            {}, nullptr,
            hostname,
            "WorkflowManager"
        ) { }
    
    int WorkflowManager::main()
    {
        this->job_manager = this->createJobManager();

        auto batch_service = *(this->getAvailableComputeServices<BatchComputeService>().begin());

        while(true)
        {
            // Add tasks onto the job_manager so it can begin processing them
            while (not this->toSubmitJobs.empty()) 
            {
                auto to_submit = this->toSubmitJobs.front();
                auto job = std::get<0>(to_submit);      
                auto service_specific_args = std::get<1>(to_submit);
                job_manager->submitJob(job, batch_service, service_specific_args);
                this->toSubmitJobs.pop();
            }

            // Clean up memory by removing completed and failed jobs
            while(not doneJobs.empty())
            {
                doneJobs.pop();
            }

            // Moves time forward for requested time while adding any completed events to a queue.
            // Needs to be done this way because waiting for next event cannot be done on another thread.
            if(check_event)
            {
                std::printf("%f\n", query_time);
                while(this->getNetworkTimeoutValue() < query_time)
                {
                    query_time -= 0.01;
                    auto event = this->waitForNextEvent(0.01);
                    events.push(event);
                }
                check_event = false;
            }

            // Exits if server needs to stop
            if(stop)
                break;
        }
        return 0;
    }

    void WorkflowManager::stopServer()
    {
        stop = true;
    }

    void WorkflowManager::addJob(const std::string& job_name, const int& duration,
                                  const unsigned int& num_nodes)
    {
        // Create tasks and add to workflow.
        auto task = this->getWorkflow()->addTask(
            job_name + "_task_" + std::to_string(query_time), (double)(duration * 60), 1, 1, 0.0);
        
        // Create a job
        auto job = job_manager->createStandardJob(task, {});

        std::map<std::string, std::string> service_specific_args;
        service_specific_args["-t"] = std::to_string(duration);
        service_specific_args["-N"] = std::to_string(num_nodes);
        service_specific_args["-c"] = std::to_string(1);
        service_specific_args["-u"] = "slurm_user";

        toSubmitJobs.push(std::make_pair(job, service_specific_args));
    }

    void WorkflowManager::getEventStatuses(std::queue<std::string>& statuses, const time_t& time)
    {
        // Checks if any events have been processed
        if(!check_event)
        {
            // Keeps retrieving events while there are events and converts them to a string(temp) to return
            // to client.
            while(events.size() > 0)
            {
                auto event = events.front();
                statuses.push(event->toString());
                events.pop();

                // Cleans up by pushing done/failed jobs onto a queue for main thread to clean up.
                if(auto failed = std::dynamic_pointer_cast<wrench::StandardJobFailedEvent>(event))
                    doneJobs.push(failed->standard_job);
                else if(auto complete = std::dynamic_pointer_cast<wrench::StandardJobCompletedEvent>(event))
                    doneJobs.push(complete->standard_job);
            }
            check_event = true;
        }
        query_time += time;
    }
}

