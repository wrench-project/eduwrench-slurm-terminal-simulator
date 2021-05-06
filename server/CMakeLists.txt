# CMakeList.txt : CMake project for TestServer, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.8)


set(CMAKE_CXX_STANDARD 11)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/CmakeModules/")


# Add needed packages
find_package(nlohmann_json 3.2.0 REQUIRED)
#find_package(pugixml)
find_package(SimGrid REQUIRED)
find_library(WRENCH_LIBRARY NAMES wrench)
find_library(WRENCH_PEGASUS_WORKFLOW_PARSER_LIBRARY NAMES wrenchpegasusworkflowparser)
find_library(PUGIXML_LIBRARY NAMES pugixml)

FIND_PACKAGE( Boost COMPONENTS program_options REQUIRED )
INCLUDE_DIRECTORIES( ${Boost_INCLUDE_DIR} )

include_directories(src/ include/ ${SimGrid_INCLUDE_DIR}/include /usr/local/include /opt/local/include /usr/local/include/wrench)


# Add source to this project's executable.
add_executable (TestServer
    "server.cpp"
    "httplib.h"
    "workflow_manager.h"
    "workflow_manager.cpp")
    
# Add pthreads
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)

target_link_libraries(TestServer
        PRIVATE Threads::Threads
        ${WRENCH_LIBRARY}
        ${WRENCH_PEGASUS_WORKFLOW_PARSER_LIBRARY}
        ${SimGrid_LIBRARY}
        ${PUGIXML_LIBRARY}
        ${Boost_LIBRARIES}
        )

