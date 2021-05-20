#FROM wrenchproject/wrench-build:ubuntu-focal-gcc9
FROM wrenchproject/wrench:unstable

MAINTAINER Henri Casanova <henric@hawaii.edu>

USER root
WORKDIR /tmp

# install NPM
#################################################
RUN sudo apt update
RUN sudo apt --assume-yes install npm

# install WRENCH 
#################################################
#RUN git clone https://github.com/wrench-project/wrench.git && cd wrench && git checkout cefc0bf739d015b2329a62750a9d70085b65a3ae && cmake . && make -j 4 && sudo make install


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

