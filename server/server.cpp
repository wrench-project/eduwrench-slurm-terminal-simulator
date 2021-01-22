#include "httplib.h"
#include "workflow_manager.h"

#include <chrono>
#include <cstdio>
#include <string>
#include <vector>
#include <thread>

#include <nlohmann/json.hpp>
#include <wrench.h>


// Define a long function which is used multiple times
#define get_time() (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count())

using httplib::Request;
using httplib::Response;
using json = nlohmann::json;

/**
 * @brief 
 */
httplib::Server server;

/**
 * @brief 
 */
time_t time_start = 0;

/**
 * @brief
 */
wrench::Simulation simulation;

/**
 * @brief
 */
wrench::Workflow workflow;

/**
 * @brief
 */
std::shared_ptr<wrench::WorkflowManager> wms;

std::vector<std::string> events;

// GET PATHS

/**
 * @brief 
 * @param req 
 * @param res 
 */
void getTime(const Request& req, Response& res)
{
    std::printf("Path: %s\n\n", req.path.c_str());

    json body;

    if (time_start == 0)
    {
        res.status = 400;
        return;
    }

    body["time"] = get_time() - time_start;
    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

/**
 * @brief
 * @param req
 * @param res
 */
void getQuery(const Request& req, Response& res)
{
    //std::printf("Path: %s\n\n", req.path.c_str());
    std::queue<std::string> status;
    events.clear();

    wms->getEventStatuses(status, 1);

    while(!status.empty())
    {
        events.push_back(status.front());
        status.pop();
    }

    json body;

    body["time"] = get_time() - time_start;
    body["events"] = events;
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_content(body.dump(), "application/json");
}

// POST PATHS

/**
 * @brief 
 * @param req 
 * @param res 
 */
void start(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

    time_start = get_time();
    res.set_header("access-control-allow-origin", "*");
    //res.set_content("", "application/json");
}

/**
 * @brief 
 * @param req 
 * @param res 
 */
void stop(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

    wms->stopServer();
    res.set_header("access-control-allow-origin", "*");
    //res.set_content("", "application/json");
}

/**
 * @brief 
 * @param req 
 * @param res 
 */
void add1(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());
    std::queue<std::string> status;

    wms->getEventStatuses(status, 60);

    while(!status.empty())
    {
        events.push_back(status.front());
        status.pop();
    }

    json body;
    time_start -= 60000;
    body["time"] = get_time() - time_start;
    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

/**
 * @brief 
 * @param req 
 * @param res 
 */
void add10(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());
    std::queue<std::string> status;

    wms->getEventStatuses(status, 600);

    while(!status.empty())
    {
        events.push_back(status.front());
        status.pop();
    }

    json body;
    time_start -= 60000 * 10;
    body["time"] = get_time() - time_start;
    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

/**
 * @brief 
 * @param req 
 * @param res 
 */
void add60(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());
    std::queue<std::string> status;

    wms->getEventStatuses(status, 3600);

    while(!status.empty())
    {
        events.push_back(status.front());
        status.pop();
    }

    json body;
    time_start -= 60000 * 60;
    body["time"] = get_time() - time_start;
    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

void addJob(const Request& req, Response& res)
{
    json req_body = json::parse(req.body);
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

    // Retrieve task creation info from request body
    std::string job_name = req_body["job"]["jobName"].get<std::string>();
    unsigned int duration = req_body["job"]["durationInSec"].get<unsigned int>();
    int num_nodes = req_body["job"]["numNodes"].get<int>();

    // Pass parameters in to function to add a job .
    wms->addJob(job_name, duration, num_nodes);

    json body;
    body["time"] = get_time() - time_start;
    body["success"] = true;
    res.set_header("access-control-allow-origin", "*");
    res.set_content(body.dump(), "application/json");
}

// ERROR HANDLING

/**
 * @brief 
 * @param req 
 * @param res 
 */
void error_handling(const Request& req, Response& res)
{
    std::printf("%d\n", res.status);
}

void init_server(int port_number)
{
    std::printf("Listening on port: %d\n", port_number);
    server.listen("0.0.0.0", port_number);
}

/**
 * @brief 
 * @return 
 */
int main(int argc, char **argv)
{
    // If using port 80, need to start server with super user permissions
    int port_number = 8080;
    // XML config file copied from batch-bag-of-tasks example
    std::string simgrid_config = "../four_hosts.xml";

    // Initialize WRENCH
    simulation.init(&argc, argv);
    simulation.instantiatePlatform(simgrid_config);
    std::vector<std::string> nodes = {"BatchNode1", "BatchNode2"};
    auto storage_service = simulation.add(new wrench::SimpleStorageService(
        "WMSHost", {"/"}, {{wrench::SimpleStorageServiceProperty::BUFFER_SIZE, "10000000"}}, {}));
    auto batch_service = simulation.add(new wrench::BatchComputeService("BatchHeadNode", nodes, {}, {}));
    wms = simulation.add(new wrench::WorkflowManager({batch_service}, {storage_service}, "WMSHost"));

    // Add workflow to wms
    wms->addWorkflow(&workflow);

    // Handle GET requests
    server.Get("/api/time", getTime);
    server.Get("/api/query", getQuery);

    // Handle POST requests
    server.Post("/api/start", start);
    server.Post("/api/stop", stop);
    server.Post("/api/add1", add1);
    server.Post("/api/add10", add10);
    server.Post("/api/add60", add60);
    server.Post("/api/addTask", addJob);

    server.set_error_handler(error_handling);

    // Initialize server on a separate thread
    std::thread server_thread(init_server, port_number);

    // Start the simulation
    simulation.launch();
    return 0;
}
