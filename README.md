# Setup
## Prerequesites
### Server
* C++ compiler
* CMake
* nlohmann_json
* pugixml
* WRENCH
### Client
* npm
* nodejs

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
Command line options for TestServer:
```
--port :  Port on which the web server is running on. Default is 80.
--nodes : Number of simulated nodes. Default is 2.
--cores : Number of simulated cores per node. Default is 1.
--tracefile <filename> : The tracefile to be used by the simulated server to simulate other users/background tasks.
```

Running the client at this point is pointing a Web browser to http://localhost or http://127.0.0.1

