FROM wrenchproject/wrench:unstable

MAINTAINER Henri Casanova <henric@hawaii.edu>

USER root
WORKDIR /tmp

# install NPM
#################################################
RUN sudo apt update
RUN sudo apt --assume-yes install npm

#################################################
# WRENCH's user
#################################################

USER wrench
WORKDIR /home/wrench

# set user's environment variable
ENV CXX="g++-9" CC="gcc-9"
ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/local/lib

# SLURM Simulator
#################################################

RUN git clone https://github.com/wrench-project/slurm_terminal_simulator.git 
RUN cd slurm_terminal_simulator/client && npm ci && ./setup.sh
RUN cd slurm_terminal_simulator/server && mkdir build && cd build && cmake -DCMAKE_MODULE_PATH=/home/wrench/slurm_terminal_simulator/server/CMakeModules .. && make -j 4 
