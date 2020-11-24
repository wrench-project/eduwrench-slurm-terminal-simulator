#ifndef WORKFLOW_MANAGER_H
#define WORKFLOW_MANAGER_H

#include <wrench-dev.h>
#include <vector>
#include <queue>

namespace wrench {

    class WorkflowManager : public WMS {

    public:
        // Constructor
        WorkflowManager(
            const std::set<std::shared_ptr<ComputeService>> &compute_services,
            const std::set<std::shared_ptr<StorageService>> &storage_services,
            const std::string &hostname
        );

        void addTask(const std::string& task_name, const double& gflops,
                     const unsigned int& min_cores, const unsigned int& max_cores,
                     const double& memory);
        void getEventStatuses(std::queue<std::string>& statuses, const time_t& time);

        void stopServer();

    private:
        int main() override;
        bool check_event = false;
        bool stop = false;
        std::queue<std::shared_ptr<wrench::WorkflowExecutionEvent>> events;
        std::queue<wrench::WorkflowJob*> doneJobs;
        time_t query_time = 0;
    };
}

#endif // WORKFLOW_MANAGER_H