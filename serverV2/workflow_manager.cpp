#include "workflow_manager.h"

#include <random>

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
            auto tasks = this->getWorkflow()->getReadyTasks();
            int index = dist(rng) % tasks.size();
            auto task1 = tasks.at(index);
            auto task2 = tasks.at((index + 1) & tasks.size());

            auto event = this->waitForNextEvent(0.01);

        }
    }

    void WorkflowManager::addJob(const std::string& job)
    {

    }

    void WorkflowManager::getJobStatus(std::string& status, const time_t& time)
    {
        
    }
}

