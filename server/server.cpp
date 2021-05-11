#include "httplib.h"
#include "SimulationThreadState.h"

#include <unistd.h>

#include <chrono>
#include <cstdio>
#include <string>
#include <vector>
#include <thread>

#include <boost/program_options.hpp>

#include <nlohmann/json.hpp>
#include <wrench.h>


// Define a long function which is used multiple times to retrieve the time
#define get_time() (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count())

using httplib::Request;
using httplib::Response;
using json = nlohmann::json;

namespace po = boost::program_options;

httplib::Server server;

/**
 * @brief Time offset used to calculate simulation time.
 * 
 * The time in milliseconds used to subtract from the current time to get the simulated time which starts at 0.
 */
time_t time_start = 0;

std::thread simulation_thread;
SimulationThreadState *simulation_thread_state;

/**
 * @brief Wrench simulation object
 */
//wrench::Simulation simulation;

/**
 * @brief Wrench workflow object
 */
//wrench::Workflow workflow;

/**
 * @brief Wrench workflow manager
 */
//std::shared_ptr<wrench::WorkflowManager> wms;

/**
 * Ugly globals
 */
std::string pp_name;
int pp_seqwork;
int pp_parwork;
int num_cluster_nodes;


// GET PATHS

/**
 * @brief Path handling the current server simulated time.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void getTime(const Request& req, Response& res)
{
    std::printf("Path: %s\n\n", req.path.c_str());

    json body;

    // Checks if time has started otherwise return an error.
    if (time_start == 0)
    {
        res.status = 400;
        return;
    }

    // Sets and returns the time.
    body["time"] = get_time() - time_start;
    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

/**
 * @brief Path handling the retrieval of even statuses.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void getQuery(const Request& req, Response& res)
{
    // Create queue to hold event statuses
    std::queue<std::string> status;
    std::vector<std::string> events;

    // Retrieves event statuses from servers and
    simulation_thread->getEventStatuses(status, (get_time() - time_start) / 1000);

    while(!status.empty())
    {
        events.push_back(status.front());
        status.pop();
    }

    json body;
    auto event_list = events;
    body["time"] = get_time() - time_start;
    body["events"] = event_list;
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_content(body.dump(), "application/json");
}

/**
 * @brief Path handling the current jobs in the queue running or waiting.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void getQueue(const Request& req, Response& res)
{
    std::printf("Path: %s\n\n", req.path.c_str());

    json body;
    body["time"] = get_time() - time_start;
    body["queue"] = wms->get_queue();;

    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

// POST PATHS

/**
 * @brief Path handling the starting of the simulation.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void start(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

    time_start = get_time();
    res.set_header("access-control-allow-origin", "*");

    json body;
    body["pp_name"] = pp_name;
    body["pp_seqwork"] = pp_seqwork;
    body["pp_parwork"] = pp_parwork;
    body["num_cluster_nodes"] = num_cluster_nodes;
    res.set_content(body.dump(), "application/json");
}

/**
 * @brief Path handling the stopping of the simulation.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void stop(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

    wms->stopServer();
    res.set_header("access-control-allow-origin", "*");
}

/**
 * @brief Path handling adding of 1 minute to current server simulated time.
 *
 * @param req HTTP request object
 * @param res HTTP response object
 */
void addTime(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());
    std::queue<std::string> status;
    std::vector<std::string> events;

    json req_body = json::parse(req.body);

    time_start -= req_body["increment"].get<int>() * 1000;

    // Retrieve the event statuses during the  skip period.
    wms->getEventStatuses(status, (get_time() - time_start) / 1000);
    cerr << "status.size() = " << status.size()  << "\n";

    while(!status.empty())
    {
        events.push_back(status.front());
        status.pop();
    }

    // Let the simulation catch up
    while ((get_time() - time_start) / 1000 > wms->simulationTime) {
        usleep(1000);
    }
//    // Wait for the simulation to catch up!
//    cerr << "WMS->GETSIMULATIONTIME: " << wms->simulationTime << "\n";
//    cerr << "sleeping 1 secon of real time\n";
//    sleep(1);
//    cerr << "WMS->GETSIMULATIONTIME: " << wms->simulationTime << "\n";

    json body;
    auto event_list = events;
    body["time"] = get_time() - time_start;
    body["events"] = event_list;
    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}


/**
 * @brief Path handling adding a job to the simulated batch scheduler.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void addJob(const Request& req, Response& res)
{
    json req_body = json::parse(req.body);
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

    // Retrieve task creation info from request body
    auto requested_duration = req_body["job"]["durationInSec"].get<double>();
    auto num_nodes = req_body["job"]["numNodes"].get<int>();
    double actual_duration = (double)pp_seqwork + ((double)pp_parwork / num_nodes);
    json body;

    // Pass parameters in to function to add a job.
    std::string jobID = wms->addJob(requested_duration, num_nodes, actual_duration);

    // Retrieve the return value from adding ajob to determine if successful.
    if(!jobID.empty())
    {
        body["time"] = get_time() - time_start;
        body["jobID"] = jobID;
        body["success"] = true;
    }
    else
    {
        body["time"] = get_time() - time_start;
        body["success"] = false;
    }

    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

/**
 * @brief Path handling canceling a job from the simulated batch scheduler.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void cancelJob(const Request& req, Response& res)
{
    json req_body = json::parse(req.body);
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());
    json body;
    body["time"] = get_time() - time_start;
    body["success"] = false;
    // Send cancel job to wms and set success in job cancelation if can be done.
    cerr << "CALLING CANCEL JOB\n";
    if(wms->cancelJob(req_body["jobName"].get<std::string>()))
        body["success"] = true;
    cerr << "CALLED CANCEL JOB\n";

    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

// ERROR HANDLING

/**
 * @brief Generic path handling for errors.
 * 
 * @param req HTTP request object
 * @param res HTTP response object
 */
void error_handling(const Request& req, Response& res)
{
    std::printf("%d\n", res.status);
}


/**
 * @brief Initializes the server.
 * 
 * @param port_number Port number the server should be running on.
 */
void init_server(int port_number)
{
    std::printf("Listening on port: %d\n", port_number);
    server.listen("0.0.0.0", port_number);
}

/**
 * @brief Creates and writes the XML config file to be used by wrench to configure simgrid.
 * 
 * @param nodes Number of nodes to be simulated.
 * @param cores Number of cores per node to be simulated.
 */
void write_xml(int nodes, int cores)
{
    std::ofstream outputXML;
    outputXML.open("config.xml");
    outputXML << "<?xml version='1.0'?>\n";
    outputXML << "<!DOCTYPE platform SYSTEM \"http://simgrid.gforge.inria.fr/simgrid/simgrid.dtd\">\n";
    outputXML << "<platform version=\"4.1\">\n";
    outputXML << "    <zone id=\"AS0\" routing=\"Full\">\n";
    outputXML << "        <cluster id=\"cluster\" prefix=\"ComputeNode_\" suffix=\"\" radical=\"0-";
    outputXML <<  std::to_string(nodes - 1) + "\" speed=\"1f\" bw=\"125GBps\" core=\"";
    outputXML <<  std::to_string(cores) +"\" lat=\"0us\" router_id=\"router\"/>\n";
    outputXML << "        <zone id=\"AS1\" routing=\"Full\">\n";
    outputXML << "            <host id=\"WMSHost\" speed=\"1f\">\n";
    outputXML << "                <disk id=\"hard_drive\" read_bw=\"100GBps\" write_bw=\"100GBps\">\n";
    outputXML << "                  <prop id=\"size\" value=\"5000GiB\"/>\n";
    outputXML << "                  <prop id=\"mount\" value=\"/\"/>\n";
    outputXML << "                </disk>\n";
    outputXML << "            </host>\n";
    outputXML <<  "           <link id=\"fastlink\" bandwidth=\"10000000GBps\" latency=\"0ms\"/>\n";
    outputXML << "            <route src=\"WMSHost\" dst=\"WMSHost\"> <link_ctn id=\"fastlink\"/> </route>\n";
    outputXML << "        </zone>\n";
    outputXML << "        <link id=\"link\" bandwidth=\"10000000GBps\" latency=\"0ms\"/>\n";
    outputXML << "        <zoneRoute src=\"cluster\" dst=\"AS1\" gw_src=\"router\" gw_dst=\"WMSHost\">\n";
    outputXML << "            <link_ctn id=\"link\"/>\n";
    outputXML << "        </zoneRoute>\n";
    outputXML << "    </zone>\n";
    outputXML << "</platform>\n";
    outputXML.close();
}

auto in = [](const auto &min, const auto &max, char const * const opt_name){
    return [opt_name, min, max](const auto &v){
        if(v < min || v > max){
            throw po::validation_error
                    (po::validation_error::invalid_option_value,
                     opt_name, std::to_string(v));
        }
    };
};

int randInt(int min, int max) {
    return rand() % (max - min + 1) + min;
}

void appendRightNowWorkloadJob(FILE *f, int num_nodes, int min_time, int max_time, int submit_time) {
    static int id = 0;
    int run_time = randInt(min_time, max_time);
    std::string line = "";
    line += std::to_string(id++) + " "; // job id
    line += std::to_string(submit_time) + " "; // submit time
    line += "0 "; // wait time
    line += std::to_string(run_time) + " "; // run time
    line += std::to_string(num_nodes) + " "; // allocated num nodes
    line += "0 "; // cpu time used
    line += "0 "; // memory
    line += std::to_string(num_nodes) + " "; // requested num nodes
    line += std::to_string(run_time + 120) + " ";
    line += "0 "; // requested memory
    line += "0 "; // status
    line += std::to_string(1 + rand() % 20) + " "; // user_id
    fprintf(f, "%s\n", line.c_str());
}


void createRightNowWorkload(FILE *f) {

    std::vector<int> job_sizes;

    if (num_cluster_nodes == 32) {
        // Space to leave: 4
        job_sizes = {7, 13, 14, 21, 26};
    } else if (num_cluster_nodes == 20) {

    } else {
        std::cerr << "No rightnow workload scheme available for " << num_cluster_nodes << " nodes\n";
        std::cerr << "You could run the ./computeRightnowJobSizes script...\n";
        exit(1);
    }

    // Generate 20 jobs that arrive at time zero
    for (int i=0; i < job_sizes.size(); i++) {
        appendRightNowWorkloadJob(f, job_sizes[i],
                                  5000,
                                  36000,
                                  0);
    }
    for (int i=job_sizes.size(); i < 15; i++) {
        appendRightNowWorkloadJob(f, job_sizes[rand() % job_sizes.size()],
                                  5000,
                                  36000,
                                  0);
    }
    // Generate 100 jobs that arrive later one after the other
    for (int i=0; i < 100; i++) {
        appendRightNowWorkloadJob(f, job_sizes[rand() % job_sizes.size()],
                                  5000,
                                  36000,
                                  7200 * (i+1));
    }

}

void createTraceFile(std::string path, std::string scheme) {
    // Create another invalid trace file
    auto trace_file  = fopen(path.c_str(), "w");
    if (scheme == "rightnow") {
        createRightNowWorkload(trace_file);
    } else {
        throw std::invalid_argument("Unknown tracefile_scheme " + scheme);
    }
//    fprintf(trace_file, "1 0 -1 3600 -1 -1 -1 4 bogus -1\n");     // INVALID FIELD
    fclose(trace_file);

}



// Main function
int main(int argc, char **argv)
{
    int port_number;
    int core_count;
    std::string tracefile_scheme;

    // Parse command-line arguments
    po::options_description desc("Allowed options");
    desc.add_options()
            ("help", "show help message")
            ("wrench-full-logs", "wrench-specific flag")
            ("nodes", po::value<int>()->default_value(4)->notifier(
                    in(1, INT_MAX, "nodes")), "number of compute nodes in the cluster")
            ("cores", po::value<int>()->default_value(1)->notifier(
                    in(1, INT_MAX, "cores")), "number of cores per compute node")
            ("tracefile", po::value<std::string>()->default_value("none"), "background workload trace file scheme (none, rightnow)")
            ("pp_name", po::value<std::string>()->default_value("parallel_program"), "parallel program name")
            ("pp_seqwork", po::value<int>()->default_value(600)->notifier(
                    in(1, INT_MAX, "pp_seqwork")), "parallel program's sequential work in seconds")
            ("pp_parwork", po::value<int>()->default_value(3600)->notifier(
                    in(1, INT_MAX, "pp_parwork")), "parallel program's parallelizable work in seconds")
            ("port", po::value<int>()->default_value(80)->notifier(
                    in(1, INT_MAX, "port")), "server port (if 80, may need to sudo)")
            ;

    po::variables_map vm;
    try {
        po::store(po::parse_command_line(argc, argv, desc), vm);
        po::notify(vm);
    } catch (std::exception &e) {
        cerr << "Error: " << e.what() << "\n";
        return 1;
    }
    num_cluster_nodes = vm["nodes"].as<int>();
    core_count = vm["cores"].as<int>();
    tracefile_scheme = vm["tracefile"].as<std::string>();
    pp_name = vm["pp_name"].as<std::string>();
    pp_seqwork = vm["pp_seqwork"].as<int>();
    pp_parwork = vm["pp_parwork"].as<int>();
    port_number = vm["port"].as<int>();

    if (vm.count("help")) {
        cout << desc << "\n";
        return 1;
    }

    // Print some logging
    cerr << "Simulating a cluster with " << num_cluster_nodes << " " << core_count << "-core nodes.\n";
    cerr << "Background workload using scheme " + tracefile_scheme << ".\n";
    cerr << "Parallel program is called " << pp_name << ".\n";
    cerr << "Its sequential work is " << pp_seqwork << " seconds.\n";
    cerr << "Its parallel work is " << pp_parwork << " seconds.\n";

    // Handle GET requests
    server.Get("/api/time", getTime);
    server.Get("/api/query", getQuery);
    server.Get("/api/getQueue", getQueue);

    // Handle POST requests
    server.Post("/api/start", start);
    server.Post("/api/stop", stop);
    server.Post("/api/addTime", addTime);
    server.Post("/api/addJob", addJob);
    server.Post("/api/cancelJob", cancelJob);

    server.set_error_handler(error_handling);

    // Path is relative so if you build in a different directory, you will have to change the relative path.
    // Currently set so that it can try find the client directory in any location. 
    // Current implementation would have a security risk
    // since any file in that directory can be loaded.
    server.set_mount_point("/", "../../client");
    server.set_mount_point("/", "../client");
    server.set_mount_point("/", ".client");

//    auto b =  Bogus();

//    std::thread bogus_thread(Bogus::bogus, argc, argv,
//                             num_cluster_nodes, core_count, tracefile_scheme);

    // Start the simulation in a separate thread
    simulation_thread_state = new SimulationThreadState();
    simulation_thread = std::thread(SimulationThreadState::createAndLaunchSimulation, argc, argv,
                                  num_cluster_nodes, core_count, tracefile_scheme);

    // Initialize server on a separate thread since simgrid uses some special handling which
    // blocks the web server from running otherwise.
    std::thread server_thread(init_server, port_number);

//    std::printf("Listening on port: %d\n", port_number);
//    server.listen("0.0.0.0", port_number);

    server_thread.join();
    return 0;
}
