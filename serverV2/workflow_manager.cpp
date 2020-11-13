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

        std::uniform_int_distribution<long> dist(0, 10000000000);
        std::mt19937 rng(42);

        while(true)
        {
            //rench::StandardJob
            // auto tasks = this->getWorkflow()->getReadyTasks();
            // int index = dist(rng) % tasks.size();
            // auto task1 = tasks.at(index);
            // auto task2 = tasks.at((index + 1) & tasks.size());

            //auto event = this->waitForNextEvent(0.01);

        }
    }

    void WorkflowManager::addTask(const wrench::WorkflowTask& task)
    {
        std::cout << "Task added\n";
    }

    void WorkflowManager::getTaskStatus(std::string& status, const time_t& time)
    {
        std::printf("Queried\n");
        auto event = this->waitForNextEvent(time - last_query_time);
        last_query_time = time;
    }
}

