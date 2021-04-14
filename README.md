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
```makefile
mkdir build && cd build && cmake ..
```
An executable called TestServer should be created.
If you want to clean up the files, then just remove the build folder.

## Building the client
After checking if you have nodejs and npm installed enter the client directory and run `npm ci`. Do not run `npm install` unless all libraries installed by npm have been checked to work then in that case, make sure to update the package.json and package-lock.json files.  
  
With node_modules folder in the directory, run the shell script setup.sh to bundle up the javascript and the needed libraries.

## Running
Make sure to start the server first before starting the client because the current implementation requires this sequence for it to run properly. Changes can be made later to make sure it doesn't matter.