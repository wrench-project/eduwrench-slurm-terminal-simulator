# CMakeList.txt : CMake project for TestServer, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.8)

# Add needed packages
find_package(Boost 1.72.0 REQUIRED)
find_package(nlohmann_json 3.2.0 REQUIRED)

# Add include libraries
include_directories(${Boost_INCLUDE_DIRS})

# Add source to this project's executable.
add_executable (TestServer
    "server.cpp"
    "router.h"
    "router.cpp"
    "response.h"
    "response.cpp")

# Link needed libraries
target_link_libraries(TestServer PRIVATE nlohmann_json::nlohmann_json)
target_link_libraries(TestServer ${Boost_LIBRARIES})
