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

    wms->getEventStatuses(status, (get_time() - time_start) / 1000);

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

/**
 * @brief
 * @param req
 * @param res
 */
void getQueue(const Request& req, Response& res)
{
    std::printf("Path: %s\n\n", req.path.c_str());
    wms->get_queue();
    res.set_header("access-control-allow-origin", "*");
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

    wms->getEventStatuses(status, (get_time() - time_start) / 1000);

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
    time_start -= 60000 * 10;

    wms->getEventStatuses(status, (get_time() - time_start) / 1000);

    while(!status.empty())
    {
        events.push_back(status.front());
        status.pop();
    }

    json body;
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
    time_start -= 60000 * 60;

    wms->getEventStatuses(status, (get_time() - time_start) / 1000);

    while(!status.empty())
    {
        events.push_back(status.front());
        std::printf("%s\n", status.front().c_str());
        status.pop();
    }

    json body;
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
    double duration = req_body["job"]["durationInSec"].get<double>();
    int num_nodes = req_body["job"]["numNodes"].get<int>();

    json body;

    std::string jobID = wms->addJob(job_name, duration, num_nodes);
    // Pass parameters in to function to add a job .
    if(jobID != "")
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

/**
 * @brief 
 * @return 
 */
int main(int argc, char **argv)
{
    // If using port 80, need to start server with super user permissions
    int port_number = 8080;
    int node_count = 2;
    int core_count = 1;

    // Command line argument handling
    if(argc > 1 && (argc - 1) % 2 == 0)
    {
        for(int i = 1; i < argc; i++)
        {
            std::string flag = argv[i++];
            int flag_val;
            try {
                flag_val = std::stoi(argv[i]);
            } catch(const std::exception&) {
                std::printf("Flag %s needs to be an integer\n", argv[i-1]);
                return -1;
            }
            if(flag == "--cores")
                core_count = flag_val;
            else if(flag == "--port")
                port_number = flag_val;
            else if(flag == "--nodes")
                node_count = flag_val;
        }
    }

    // XML generated then read.
    write_xml(node_count, core_count);
    std::string simgrid_config = "config.xml";

    // Initialize WRENCH
    simulation.init(&argc, argv);
    simulation.instantiatePlatform(simgrid_config);
    // Generate vector containing variable number of compute nodes
    std::vector<std::string> nodes = {"ComputeNode_0"};
    for(int i = 1; i < node_count; ++i)
        nodes.push_back("ComputeNode_" + std::to_string(i));
    // Construct all services
    auto storage_service = simulation.add(new wrench::SimpleStorageService(
        "WMSHost", {"/"}, {{wrench::SimpleStorageServiceProperty::BUFFER_SIZE, "10000000"}}, {}));
    auto batch_service = simulation.add(new wrench::BatchComputeService("ComputeNode_0", nodes, {}, {}));
    wms = simulation.add(new wrench::WorkflowManager({batch_service}, {storage_service}, "WMSHost", nodes.size()));

    // Add workflow to wms
    wms->addWorkflow(&workflow);

    // Handle GET requests
    server.Get("/api/time", getTime);
    server.Get("/api/query", getQuery);
    server.Get("/api/getQueue", getQueue);

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
