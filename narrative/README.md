NOTES: We'll need a way to "reset" simulations

# Draft Pedagogic Module Narrative
---

Content below is text that will eventually find its way into EduWRENCH.

---

# TAB #1: Basic Concepts

### Batch schedulers

Large parallel platforms are expensive, not only for initial hardware
purchases and ongoing maintenance, but also in terms of electrical power
consumption.  This is why in most organizations these platforms are
*shared* among users. This sharing can be done in different ways depending
on the context. For instance, cloud providers allow transparent sharing by
giving user virtual machine instances that transparently run on the
physical machines.  In the field of High Performance Computing, a
traditional way to allow this sharing is with a **batch scheduler**.

Consider a cluster of homogeneous multi-core nodes (or just "nodes").  A
batch scheduler is a software service that allows users to submit **jobs**
to the cluster. Submitting jobs is typically the only way for users to
access the cluster's nodes.  Each job specifies a desired *number of
nodes*, a desired *duration*, and a program to run on these nodes. For
instance, a job can say: "I need 4 nodes for 2 hours".  These job requests
are placed in a **queue**, where they wait until the nodes they need are
available. A decent real-world analogy is parties of diners waiting for
tables at a busy restaurant, where the host person is the batch scheduler.
The difference is that in addition to saying "we need a table with 4 seats"
(in our case seats are nodes) parties would also need to give a time limit
("we need 2 hours to eat").

After waiting in the queue, a job is allocated to and started on available nodes.
Importantly, *jobs are forcefully terminated if they go over their time
limit!*  So if the user's program needs 3 hours to run but the job only
requested 2 hours, the program will not complete successfully. Unless the
program has saved its state to disk while it was running, all
is lost and the program must be restarted from scratch.

---

### Slurm

A well-known batch scheduler is [Slurm](https://slurm.schedmd.com). In
this pedagogic module, we assume that Slurm is installed on a cluster to
which you want to submit jobs.  We picked Slurm due to its popularity, but
the same concepts apply to all batch schedulers.

**Disclaimer**: This module in no way provides comprehensive Slurm training. 
The intent is to introduce you to batch scheduling in general, using Slurm
as an example. *And in fact, you will be only exposed to a small
and simplified subset of the Slurm functionality.*

---

This module assumes that you have very basic knowledge of the Linux
command-line.  To get started, just go to the next tab on this page!

---

# TAB #2: Job Submission

## The sbatch command

You were given an account on a batch-scheduled cluster with 10 
nodes. You have logged in to cluster's *frontend node*, on which you can
run Slurm commands to use the cluster's nodes. The **sbatch** command is
used to submit jobs. It takes a single command-line argument, which is the
name of a "batch script". The batch script specifies the job request, and
in particular the desired number of nodes and duration. 
The first thing for you to learn is how to submit a job. 

## Simulated scenario

In your working directory on the cluster's front-end node there is:
  - An executable called *myprogram* which is the program you want to run
    on the cluster. This program can run on one or more nodes, each time
    using all the cores on each node. It has the following parallel
    speedup behavior: **It runs in $2 + 20/n$ hours when executed on $n$ nodes**
    (typical Amdahl's Law behavior). So for instance, running 
    *myprogram* on 5 nodes takes 6 hours.
  - A so-called "batch script", stored in file XXX.slurm, which is to be
    passed to the Slurm **sbatch**.  This batch script specifies the desired
    number nodes and duration for running *myprogram* as a job on the cluster.

The **sbatch** command is used to submit jobs. It takes a batch script as a single command-line
argument. When invoked, it submits the the corresponding job to the batch scheduler
and prints an integer job ID after being invoked, say 1234.
After the job is done, two files are created: 1234.out and 1234.err.
1234.out containes the stantard output of *myprogram*, and 1234.err the
standard error.  For our purposes, if *myprogram* has completed
successfully, the .out file contains some success message and the .err file
is empty. If instead *myprogram* has failed, then .out file is empty and
the .err file contains some failure message.  

In the real world, *myprogram* would generate additional meaningful output
files.  Also, on the activity below your will submit multiple jobs to run
*myprogram*. The intent is that each run would be for different input.


## Simulation activity

The simulation app at the bottom of this page presents you with a
very limited (fake) Linux terminal on the cluster's frontend node. 
 Only a few commands are supported: cat, rm, date, edit, XXX,  and **sbatch**. 
*This
app shows you the (simulated) time of the day, and makes it possible for you to advance
in time at will.*

You can edit this batch script using the **edit**
    command to specify a desired number of nodes and duration. 

Use the app to do (at least) the following:

  1. Successful job execution
    - Using the *edit* command, edit the batch script to specify that you want
      to run *myprogram* on 4 nodes. Specify a duration that is sufficient
      for *myprogram* to complete successfully. 
    - Submit this job to the batch scheduled and move time forward until after the job should have completed. 
    - Double check the content and creation date of the .out and .err files.
    - Does *myprogram* complete about when you thought it would?

  2. Failed job execution

    - Now Submit a job to run *myprogram* on 6 nodes *without* enough requested time, so that it will certainly fail. 
    - Once enough time has passed, double-check the content and creation date of the .out and .err files. 
    - Does *myprogram* fail about when you thought it would?

  3. Queue waiting time

    - Submit a job to run *myprogram* on 8 nodes with enough requested time so that it will successfully complete.
    - Soon after, submit another job to run *myprogram* succesfully again, but using 4 nodes.
    - Without advancing time, estimate the following:
      - the completion time of the first job
      - the wait time of the second job
      - the completion time of the second job
    - Verify your answers to the above questions by advancing the clock!


SIMULATOR GOES HERE

---

# TAB #3: Job cancellation and queue

### The scancel and squeue commands

In addition to **sbatch** for submitting jobs, let's now use two other Slurm commands:

  - *scancel* is used to cancel jobs. It takes an integer job ID as its single 
    command-line argument.

  - *squeue* is used to list all jobs currently in the systems, which are either pending (i.e., submitted but not running yet) or running.


### Simulated scenario

The simulation app at the bottom of this page is similar to that in the
previous tab. In the app on the previous tab, you were the only user on
the cluster. Now, instead, **you are competing with other users!** These
other users submit whatever jobs whenever they want, which is out of your
control. 

### Simulation activity

Use the app to do (at least) the following:

  1. Job submission and cancellation

    - Submit a job to run *myprogram* on 6 nodes successfully. 
    - Soon after submission, inspect the state of the batch queue and answer the following questions:
        - How many jobs are currently pending?
        - How many jobs are currently running?
        - Is your job pending or running?
    - Then simply cancel your job.

  2. Sneaky job submission

    - Reset the simulation to go back to the initial time. 
    - Inspect the state of the queue and answer the following questions:
        - How many nodes are currently used by the jobs?
    - Submit a job to run *myprogram* successfully, asking for as many nodes as possible so that your job can run right now (unless another competing job shows up in the nick of time!)
    - Inspect the state of the queue. Is your job running?

---

# TAB #4: Crafting job sizes

In the simulated activity on the previous tab, you faced competition with
users. This was a very simple example in which you used whatever
number of nodes were available at the time of submission. But
perhaps you could have submitted a job asking for more nodes, which may
have waited not too long in the queue, and then eventually completed
earlier! Let try this out with the simulated application at the bottom of
this page, which is similar to that in the previous tab.

### Simulation activity

Use the app to do (at least) the following:

  1. Inspect the state of the queue. You should see that only 1 node is available right now. 
  2. If you were to submit a 1-node job right now, when would myprogram complete? 
  3. Submit a 2-node job and ask for just enough time for myprogram to complete.
  4. When does this job complete? 
  5. Which option was better: using 1 node or using 2 nodes? 


---

# TAB #5: Impact of job durations

In the previous tab, the instructions in the simulated activity said "ask
for just enough time for myprogram to complete". It turns out that many
users, in practice ask for much more time that needed. This is because they
do not know how long their program will run (for instance, the program runs
shorter or longer based on its input data). Furthermore, users many not
know the speedup behavior of their programs. So although they may know how
long the program would run on 1 node, they don't know how long it will run
on 10 nodes.  Since asking for too little time leads to job failures, most
users are conservative and ask for more time. This behavior has been
studied by researchers (here is a [research
article](https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.9.5068&rep=rep1&type=pdf),
if interested).

The problem with asking for too much time is that it can increase a job's wait
time (due to most batch schedulers implementing a strategy called "backfilling", which
allows smaller/shorter jobs to jump ahead in the queue!).  


Let's witness first-hand the impact of the requested job duration using the
simulation app at the bottom of this page.

### Simulation activity

Use the app to do (at least) the following:

  1. Asking for just the right amount of time
    - Feel free to inspect the state of the queue, which will show that all nodes are currently busy.
    - Submit a job asking for 4 nodes and just enough time to run *myprogram*.
    - At what time did the job complete?
  2. Asking for too much time
    - Reset the simulation and resubmit the job, but now asking for 24 hours, pretending to be a user who doesn't know the program's speedup behavio and being conservative
    - At what time did the job complete? 
  3. Exploring
    - Feel free to reset the simulation and resubmit the job with different durations, so see the behavior. The behavior is non-continous: when asking for one more second, the job's wait time can jump by hours.




---






