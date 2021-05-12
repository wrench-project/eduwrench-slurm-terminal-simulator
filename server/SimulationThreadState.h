#include "workflow_manager.h"
#include <unistd.h>


class SimulationThreadState {
public:
    std::shared_ptr<wrench::WorkflowManager> wms;

    ~SimulationThreadState() {}

    void getEventStatuses(std::queue<std::string>& statuses, const time_t& time);

    std::string addJob(const double& requested_duration,
                       const unsigned int& num_nodes, const double& actual_duration);

    bool cancelJob(const std::string& job_name);

    void stopServer();

    std::vector<std::string> getQueue();

    void createAndLaunchSimulation(int main_argc, char **main_argv, int num_nodes, int num_cores,
                                          std::string tracefile_scheme);

    double getSimulationTime();
};
