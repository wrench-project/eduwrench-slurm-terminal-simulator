# Setup
## Prerequesites
### Server
* C++ compiler
* CMake (v3.8+)
* nlohmann_json
* pugixml
* WRENCH
### Client
* npm (Latest or at least v6.x+)

## Building the server
As long as you have the prerequisite libraries installed, running the following should suffice.
```bash
mkdir build && cd build && cmake ..
```
An executable called TestServer should be created.
If you want to clean up the files, then just remove the build folder.

## Building the client
After checking if you have nodejs and npm installed enter the client directory and run `npm ci`. Do not run `npm install` unless all libraries installed by npm have been checked to work then in that case, make sure to update the package.json and package-lock.json files.  
  
**Make sure to change the serverAddress variable on line 49 in the index.js file to the correct ip address to wherever the server is running which is most likely localhost.**
  
With node_modules folder in the directory, run the shell script setup.sh to bundle up the javascript and the needed libraries.

## Running

Superuser permission may be required because the server listens on port 80. (For whatever reason, if the server does not run on port 80, then the client cannot make the necessary REST API requests.)


```
% cd server/build; sudo ./TestServer xxx xxx xxxx
```
Command line options for TestServer: type `./TestServer --help`

Running the client at this point is pointing a Web browser to http://localhost or http://127.0.0.1

Note that if the client was already running, then it will connect to the server, but timing between client and server will be non-sensical. 

## Some Design Decisions

Multi-threading of the server is needed since both WRENCH and the web server can each block the other from running. Due to something from WRENCH (most likely SimGrid), you cannot spawn threads from the web server when it starts but rather the main thread (the one in which the program is initially running on) will be running the simulation and spawns a thread which runs the web server. One way to start and stop the server might be to run the `simulation.launch` function in a loop until the entire server needs to close. To make sure that the simulation doesn't block, it will depend on an API call to end the main simulation loop where the API call to the `stop` endpoint can be called when leaving the page or closing it by using the built-in front-end function `unload`.

# Docker

The Dockerfile in the top-level directory specifies a Docker container for running
the simulator/server. For instance:

```
docker run -p 8808:8808 --rm -it wrenchproject/eduwrench-slurm-terminal ./run_it.sh tab4
```
will start a Docker container with a Web server for the simulation in Tab 4 on localhost that listens to port 8808. Simply point your browser to localhost:8808 and voila. 
