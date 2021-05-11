#include "workflow_manager.h"
#include <unistd.h>


class SimulationThreadState {
public:
    std::shared_ptr<wrench::WorkflowManager> wms;

    static void  getEventStatuses(std::queue<std::string>& statuses, const time_t& time);

    static void createAndLaunchSimulation(int main_argc, char **main_argv, int num_nodes, int num_cores,
                                          std::string tracefile_scheme);
};
