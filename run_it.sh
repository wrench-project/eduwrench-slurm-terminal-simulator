#!/bin/bash

set -e

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <hostname> <port> [server arguments...]"
    echo "Example: $0 localhost 8080 --nodes 32 --tracefile rightnow"
    exit 1
fi

# Check that server/build exists
if [[ ! -d ./server/build ]]
then
    echo "Directory server/build doesn't exist."
    exit 1
fi

HOSTNAME=$1
PORT=$2

SERVERARGS="--port $PORT "

#Construct server arguments
shift
shift
while test $# -gt 0
do
    SERVERARGS=$SERVERARGS" "$1
    shift
done


# Set up the client
printf "export class ServerAddress {\\n  constructor() {\n    this.address = \"$HOSTNAME:$PORT/api\";\n  }\n}\n" > client/server_address.js
cd client
npm ci
./setup.sh
cd ..

# Start the server
cd server/build
cmake .. && make && ./TestServer $SERVERARGS


