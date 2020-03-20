#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/config.hpp>

#include <nlohmann/json.hpp>

#include <iostream>
#include <memory>
#include <string>
#include <thread>

#include "router.h"
#include "response.h"

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using json = nlohmann::json;
using tcp = boost::asio::ip::tcp;

Router* router;

void handle_request(http::request<http::string_body>&& req, tcp::socket& socket, bool& close)
{
    json body;
    auto const method = req.method();
    if (method != http::verb::get && method != http::verb::post)
    {
        return send_bad_response("Not a GET or POST Request", socket, close, req);
    }

    if (req.base()["Content-Type"].compare("application/json") != 0)
    {
        return send_bad_response("Not JSON formatted request", socket, close, req);
    }
    
    std::string path(req.target());

    try
    {
        body = json::parse(req.body());
    }
    catch (...)
    {
        send_bad_response("Invalid JSON", socket, close, req);
    }

    if (method == http::verb::get)
        router->get(path, body, req, socket, close);
    else
        router->post(path, body, req, socket, close);
}

// Report a failure
void fail(beast::error_code ec, char const* what)
{
    std::cerr << what << ": " << ec.message() << "\n";
}

// Handles an HTTP server connection
void do_session(tcp::socket* socket)
{
    bool close = false;
    beast::error_code ec;

    // This buffer is required to persist across reads
    beast::flat_buffer buffer;

    while(true)
    {
        // Read a request
        http::request<http::string_body> req;
        http::read(*socket, buffer, req, ec);
        if (ec == http::error::end_of_stream)
            break;
        if (ec)
            return fail(ec, "read");

        // Send the response
        handle_request(std::move(req), *socket, close);
        if (ec)
            return fail(ec, "write");
        if (close)
        {
            // This means we should close the connection, usually because
            // the response indicated the "Connection: close" semantic.
            break;
        }
    }

    // Send a TCP shutdown
    socket->shutdown(tcp::socket::shutdown_send, ec);
    delete socket;

    // At this point the connection is closed gracefully
}

int main()
{
    try
    {
        auto const address = net::ip::make_address("127.0.0.1");
        unsigned short const port = 8080;
        auto const doc_root = std::make_shared<std::string>(".");

        router = new Router();

        // The io_context is required for all I/O
        net::io_context ioc{ 1 };

        // The acceptor receives incoming connections
        tcp::acceptor acceptor{ ioc, {address, port} };

        std::cout << "Server started\n";
        while(true)
        {
            // This will receive the new connection
            tcp::socket* socket = new tcp::socket(ioc);

            // Block until we get a connection
            acceptor.accept(*socket);

            std::thread session(do_session, socket);
            session.detach();
            std::cout << "Request received\n";
        }
    }
    catch (const std::exception & e)
    {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }
}