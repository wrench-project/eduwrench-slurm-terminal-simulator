#include "router.h"
#include "response.h"

#include <chrono>

#define get_time() (chrono::duration_cast<chrono::milliseconds>(chrono::system_clock::now().time_since_epoch()).count())

namespace chrono = std::chrono;

void Router::parse_json(http::request<http::string_body>& req, json& j)
{
    try
    {
        j = json::parse(req.body());
    }
    catch (...)
    {
        j = nullptr;
    }
}

void process_path(std::string& path)
{
    if (path.size() == 1)
    {
        path = "/";
        return;
    }

    bool remove_slash = false;
    size_t length = path.size() - 1;
    size_t slash_loc = 1;
    if (path.back() == '/')
    {
        remove_slash = true;
        --length;
    }
    
    for (size_t i = length; 0 < i; --i)
    {
        if (path[i] == '/')
        {
            slash_loc = i;
            break;
        }
    }
    path = path.substr(slash_loc, length);
}

void Router::get(
    std::string& path,
    http::request<http::string_body>& req,
    tcp::socket& socket,
    bool& close)
{
    json res, j;
    process_path(path);

    if (path.compare("/") == 0)
    {
        send_response(new std::string("HOME"), socket, close, req);
        return;
    }
    else if (path.compare("time") == 0)
    {
        res["time"] = get_time() - time_start;
        send_response(res, socket, close, req);
        return;
    }

    send_notfound_response(socket, close, req);
}

void Router::post(
    std::string& path,
    http::request<http::string_body>& req,
    tcp::socket& socket,
    bool& close)
{
    json res, j;
    process_path(path);

    if (path.compare("/") == 0)
    {
        parse_json(req, j);
        if (j == nullptr)
        {
            send_bad_response("Invalid JSON", socket, close, req);
            return;
        }
        send_response(new std::string("HOME"), socket, close, req);
        return;
    }
    else if (path.compare("start") == 0)
    {
        time_start = get_time();
        send_response(new std::string("success"), socket, close, req);
        return;
    }
    else if (path.compare("add1") == 0)
    {
        time_start -= 60000;
        res["time"] = get_time() - time_start;
        send_response(res, socket, close, req);
        return;
    }
    else if (path.compare("add10") == 0)
    {
        time_start -= 60000 * 10;
        res["time"] = get_time() - time_start;
        send_response(res, socket, close, req);
        return;
    }
    else if (path.compare("add60") == 0)
    {
        time_start -= 60000 * 60;
        res["time"] = get_time() - time_start;
        send_response(res, socket, close, req);
        return;
    }

    send_notfound_response(socket, close, req);
}