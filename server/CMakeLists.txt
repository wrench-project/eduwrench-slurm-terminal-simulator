# CMakeList.txt : CMake project for TestServer, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.8)

# Add needed packages
find_package(nlohmann_json 3.2.0 REQUIRED)
find_package(pugixml)

# Add source to this project's executable.
add_executable (TestServer
    "server.cpp"
    "httplib.h"
    "workflow_manager.h"
    "workflow_manager.cpp")
    
# Add pthreads
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)
target_link_libraries(TestServer PRIVATE Threads::Threads)

# Add simgrid libraries and includes
include_directories(/opt/simgrid/include /opt/local/include)
link_directories(/opt/simgrid/lib /opt/local/lib)

# Link needed libraries
target_link_libraries(TestServer PRIVATE nlohmann_json::nlohmann_json wrench simgrid pugixml)
