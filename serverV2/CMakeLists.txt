# CMakeList.txt : CMake project for TestServer, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.8)

# Add needed packages
find_package(nlohmann_json 3.2.0 REQUIRED)

# Add source to this project's executable.
add_executable (TestServer
    "server.cpp"
    "httplib.h")
    
# Add pthreads
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)
target_link_libraries(TestServer PRIVATE Threads::Threads)

# Link needed libraries
target_link_libraries(TestServer PRIVATE nlohmann_json::nlohmann_json)
