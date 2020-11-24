#include "workflow_manager.h"

#include <random>
#include <iostream>

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
        auto job_manager = this->createJobManager();

        auto batch_service = *(this->getAvailableComputeServices<BatchComputeService>().begin());
        auto storage_service = *(this->getAvailableStorageServices().begin());

        while(true)
        {
            // Add tasks onto the job_manager so it can begin processing them
            auto tasks = this->getWorkflow()->getReadyTasks();
            for(auto task : tasks)
            {
                std::map<WorkflowFile *, std::shared_ptr<FileLocation>> file_locations;
                file_locations[task->getInputFiles()[0]] = FileLocation::LOCATION(storage_service);
                file_locations[task->getOutputFiles()[0]] = FileLocation::LOCATION(storage_service);
                StandardJob* job = job_manager->createStandardJob(task, file_locations);
                job_manager->submitJob(job, batch_service);
            }

            // Clean up memory by removing completed and failed jobs
            while(doneJobs.size() > 0)
            {
                job_manager->forgetJob(doneJobs.front());
                doneJobs.pop();
            }

            // Moves time forward for requested time while adding any completed events to a queue.
            // Needs to be done this way because waiting for next event cannot be done on another thread.
            if(check_event)
            {
                time_t q_time = query_time;
                while(this->getNetworkTimeoutValue() < q_time)
                {
                    auto event = this->waitForNextEvent(0.01);
                    events.push(event);
                }
                check_event = false;
            }

            // Exits if server needs to stop
            if(stop)
                break;
        }
    }

    void WorkflowManager::stopServer()
    {
        stop = true;
    }

    void WorkflowManager::addTask(const std::string& task_name, const double& gflops,
                                  const unsigned int& min_cores, const unsigned int& max_cores,
                                  const double& memory)
    {
        // Create tasks and add to workflow.
        auto task = this->getWorkflow()->addTask(
            task_name + std::to_string(query_time), gflops, min_cores, max_cores, memory);
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
        query_time = time;
    }
}

