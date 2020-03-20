#ifndef RESPONSE_H
#define RESPONSE_H

#include <ctime>
#include <string>
#include <iostream>

#include <nlohmann/json.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/config.hpp>

namespace beast = boost::beast;
namespace http = beast::http;
using tcp = boost::asio::ip::tcp;

using json = nlohmann::json;

void send_notfound_response(tcp::socket& socket, bool& close, http::request<http::string_body>& req);
void send_response(json& text, tcp::socket& socket, bool& close, http::request<http::string_body>& req);
void send_response(std::string* text, tcp::socket& socket, bool& close, http::request<http::string_body>& req);
void send_response(http::response<http::string_body>* res, tcp::socket& socket, bool& close, http::request<http::string_body>& req);
void send_error_response(tcp::socket& socket, bool& close, http::request<http::string_body>& req);
void send_bad_response(std::string text, tcp::socket& socket, bool& close, http::request<http::string_body>& req);


#endif // !RESPONSE_H
