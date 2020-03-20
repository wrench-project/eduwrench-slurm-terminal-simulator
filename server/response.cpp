#include "response.h"

void send_response(
    std::string* text,
    tcp::socket& socket,
    bool& close,
    http::request<http::string_body>& req)
{
    http::response<http::string_body> res{ http::status::bad_request, req.version() };
    res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
    res.keep_alive(req.keep_alive());

    res.prepare_payload();

    json response;
    response["data"] = *text;

    close = res.need_eof();
    http::write(socket, res);
    delete text;
}

void send_response(
    json& text,
    tcp::socket& socket,
    bool& close,
    http::request<http::string_body>& req)
{
    http::response<http::string_body> res{ http::status::bad_request, req.version() };
    res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
    res.keep_alive(req.keep_alive());
    res.body() = text.dump();
    res.prepare_payload();

    close = res.need_eof();
    http::write(socket, res);
}

// Used to send a text message back to client from server as JSON object
void send_response(
    http::response<http::string_body>* res,
    tcp::socket& socket,
    bool& close,
    http::request<http::string_body>& req)
{
    res->set(http::field::server, BOOST_BEAST_VERSION_STRING);
    res->set(http::field::content_type, "application/json");
    res->keep_alive(req.keep_alive());

    res->prepare_payload();

    close = res->need_eof();
    http::write(socket, *res);
    delete res;
}

// Used to send a text message back to client from server as JSON object
void send_bad_response(
    std::string text,
    tcp::socket& socket,
    bool& close,
    http::request<http::string_body>& req)
{
    http::response<http::string_body> res{ http::status::bad_request, req.version() };
    res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
    res.set(http::field::content_type, "application/json");
    res.keep_alive(req.keep_alive());

    json response;
    response["error"] = text;

    res.body() = response.dump();
    res.prepare_payload();

    close = res.need_eof();
    http::write(socket, res);
}

void send_error_response(
    tcp::socket& socket,
    bool& close,
    http::request<http::string_body>& req)
{
    http::response<http::string_body> res{ http::status::internal_server_error, req.version() };
    res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
    res.set(http::field::content_type, "application/json");
    res.keep_alive(req.keep_alive());
    res.body() = std::string("Server Error");
    res.prepare_payload();

    close = res.need_eof();
    http::write(socket, res);
}

void send_notfound_response(
    tcp::socket& socket,
    bool& close,
    http::request<http::string_body>& req)
{
    http::response<http::string_body> res{ http::status::not_found, req.version() };
    res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
    res.set(http::field::content_type, "application/json");
    res.keep_alive(req.keep_alive());
    res.body() = std::string("Page not found");
    res.prepare_payload();

    close = res.need_eof();
    http::write(socket, res);
}