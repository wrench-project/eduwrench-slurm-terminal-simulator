#!/bin/bash
#
# This script is used to run in one command the simulator/server for the
# EduWRENCH pedagogic module focused on Slurm. It's used typically inside
# a Docker container.

set -e

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <hostname> <port> <tab2|...|tab5>"
    echo "Example: $0 localhost 8080 tab3"
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
SCENARIO=$3

SERVERARGS="--port $PORT "

case "$SCENARIO" in

tab2)  SERVERARGS=$SERVERARGS" --node 32 --pp_name myprogram --pp_seqwork 7200 --pp_parwork 72000"
    ;;
tab3)  SERVERARGS=$SERVERARGS" --node 32 --pp_name myprogram --pp_seqwork 7200 --pp_parwork 72000"
    ;;
tab4)  SERVERARGS=$SERVERARGS" --node 32 --pp_name myprogram --pp_seqwork 7200 --pp_parwork 72000 --tracefile rightnow"
    ;;
tab5)  SERVERARGS=$SERVERARGS" --node 32 --pp_name myprogram --pp_seqwork 7200 --pp_parwork 72000 --tracefile backfilling"
    ;;
*) echo "Unknown scenario argument $SCENARIO"
   exit 1
   ;;
esac

# Set up the client
printf "export class ServerAddress {\\n  constructor() {\n    this.address = \"$HOSTNAME:$PORT/api\";\n  }\n}\n" > client/server_address.js
cd client
npm ci
./setup.sh
cd ..

# Start the server
cd server/build
cmake .. && make && ./TestServer $SERVERARGS


