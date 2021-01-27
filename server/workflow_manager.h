#ifndef WORKFLOW_MANAGER_H
#define WORKFLOW_MANAGER_H

#include <wrench-dev.h>
#include <map>
#include <vector>
#include <queue>
#include <mutex>

namespace wrench {

    class WorkflowManager : public WMS {

    public:
        // Constructor
        WorkflowManager(
            const std::set<std::shared_ptr<ComputeService>> &compute_services,
            const std::set<std::shared_ptr<StorageService>> &storage_services,
            const std::string &hostname
        );

        void addJob(const std::string& job_name, const double& duration,
                     const unsigned int& num_nodes);
        void getEventStatuses(std::queue<std::string>& statuses, const time_t& time);

        void stopServer();

    private:
        int main() override;
        std::shared_ptr<JobManager> job_manager;
        bool check_event = false;
        bool stop = false;
        std::queue<std::shared_ptr<wrench::WorkflowExecutionEvent>> events;
        std::queue<std::shared_ptr<wrench::WorkflowJob>> doneJobs;
        std::queue<std::pair<std::shared_ptr<wrench::StandardJob>, std::map<std::string, std::string>>> toSubmitJobs;
        std::mutex queue_mutex;
        double server_time = 0;
    };
}

#endif // WORKFLOW_MANAGER_H
