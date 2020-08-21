#include <iostream>

#include "httplib.h"

using httplib::Request;
using httplib::Response;

httplib::Server server;

void testGet(const Request& req, Response& res)
{
    res.set_content("Hello World!", "text/plain");
}

int main()
{
    httplib::Server::Handler testGetHandle = testGet;
    server.Get("/test", testGetHandle);
    server.listen("localhost", 8080);
    return 0;
}