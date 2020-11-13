#ifndef WORKFLOW_MANAGER_H
#define WORKFLOW_MANAGER_H

#include <wrench-dev.h>
#include <vector>

namespace wrench {

    class WorkflowManager : public WMS {

    public:
        // Constructor
        WorkflowManager(
            const std::set<std::shared_ptr<ComputeService>> &compute_services,
            const std::set<std::shared_ptr<StorageService>> &storage_services,
            const std::string &hostname
        );

        void addTask(const wrench::WorkflowTask& task);
        void getTaskStatus(std::string& status, const time_t& time);

    private:
        int main() override;
        time_t last_query_time = 0;
    };
}

#endif // WORKFLOW_MANAGER_H