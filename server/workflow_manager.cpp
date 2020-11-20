#include "workflow_manager.h"

#include <random>
#include <iostream>

#define GFLOPS 1000000000

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

        std::uniform_int_distribution<long> dist(0, 10000000000);
        std::mt19937 rng(42);

        while(true)
        {
            // wrench::StandardJob
            // auto tasks = this->getWorkflow()->getReadyTasks();
            // int index = dist(rng) % tasks.size();
            // auto task1 = tasks.at(index);
            // auto task2 = tasks.at((index + 1) & tasks.size());

            //auto event = this->waitForNextEvent(0.01);
            if(check_event)
            {
                time_t q_time = query_time;
                while(this->getNetworkTimeoutValue() < q_time)
                {
                    auto event = this->waitForNextEvent(0.01);
                    events.push(event);
                }
            }
        }
    }

    void WorkflowManager::addTask(const std::string& task_name, const double& gflops,
                                  const unsigned int& min_cores, const unsigned int& max_cores,
                                  const double& parallel_efficiency, const double& memory)
    {
        // Create tasks and add to workflow.
        auto task = this->getWorkflow()->addTask(task_name + std::to_string(query_time),
                                                 gflops * GFLOPS, min_cores, max_cores, memory);
        // Set parallel efficiency
        task->setParallelModel(wrench::ParallelModel::CONSTANTEFFICIENCY(parallel_efficiency));
    }

    void WorkflowManager::getEventStatuses(std::queue<std::string>& statuses, const time_t& time)
    {
        if(!check_event)
        {
            while(!events.empty())
            {
                statuses.push(events.front()->toString());
                events.pop();
            }
            check_event = true;
        }
        query_time = time;
    }
}

