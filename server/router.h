#ifndef ROUTER_H
#define ROUTER_H

#include <ctime>
#include <string>
#include <iostream>

#include <nlohmann/json.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>

namespace beast = boost::beast;
namespace http = beast::http;
using tcp = boost::asio::ip::tcp;
using json = nlohmann::json;

class Router {
private:
    std::time_t time_start = 0;
    void parse_json(http::request<http::string_body>& req, json& j);
public:
    Router() { };
    ~Router() { };
    void get(std::string& path, http::request<http::string_body>& req, tcp::socket& socket, bool& close);
    void post(std::string& path, http::request<http::string_body>& req, tcp::socket& socket, bool& close);
};

#endif // !ROUTER_H
