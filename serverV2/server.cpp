#include "httplib.h"

#include <chrono>
#include <cstdio>

#include <nlohmann/json.hpp>

// Define a long function which is used multiple times
#define get_time() (chrono::duration_cast<chrono::milliseconds>(chrono::system_clock::now().time_since_epoch()).count())

namespace chrono = std::chrono;

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


// TEST PATHS

/**
 * @brief 
 * @param req 
 * @param res 
*/
void testGet(const Request& req, Response& res)
{
    std::printf("Path: %s\n\n", req.path.c_str());

    res.set_header("access-control-allow-origin", "*");
    res.set_content("Hello World!", "text/plain");
}

/**
 * @brief 
 * @param req 
 * @param res 
*/
void testPost(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

    res.set_header("access-control-allow-origin", "*");
    res.set_content("Hello World!", "text/plain");
}


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
    std::printf("Path: %s\n\n", req.path.c_str());

    json body;

    body["time"] = get_time() - time_start;
    body["query"] = "A query to the server was made.";
    res.set_header("access-control-allow-origin", "*");
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
void add1(const Request& req, Response& res)
{
    std::printf("Path: %s\nBody: %s\n\n", req.path.c_str(), req.body.c_str());

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

    json body;
    time_start -= 60000 * 60;
    body["time"] = get_time() - time_start;
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
    //std::printf("%d\n", res.status);
}

/**
 * @brief 
 * @return 
*/
int main()
{
    int port_number = 8080;

    // Handle GET requests
    server.Get("/", testGet);
    server.Get("/time", getTime);
    server.Get("/query", getQuery);

    // Handle POST requests
    server.Post("/", testPost);
    server.Post("/start", start);
    server.Post("/add1", add1);
    server.Post("/add10", add10);
    server.Post("/add60", add60);

    std::printf("Listening on port: %d\n", port_number);

    server.set_error_handler(error_handling);
    server.listen("localhost", port_number);
    return 0;
}