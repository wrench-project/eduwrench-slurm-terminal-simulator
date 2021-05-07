NOTES: We'll need a way to "reset" simulations

# Draft Pedagogic Module Narrative

---

Content below is text that will eventually find its way into EduWRENCH.

---

# TAB #1: Basic Concepts

### Batch schedulers

Large parallel platforms are expensive, not only for initial hardware purchases and ongoing maintenance, but also in terms of electrical power consumption.  This is why in most organizations these platforms are *shared* among users. This sharing can be done in different ways depending on the context. For instance, cloud providers allow transparent sharing by giving user virtual machine instances that transparently run on the physical machines.  In the field of High Performance Computing, a typical way to allow this sharing is with a **batch scheduler**.

Consider a cluster of homogeneous compute nodes (or just "nodes").  A batch scheduler is a software service that allows users to submit **jobs** to the cluster. Submitting jobs is typically the only way for users to access the cluster's nodes.  Each job specifies a desired *number of nodes*, a desired *duration*, and a program to run on these nodes. For instance, a job can say: "I need 4 nodes for 2 hours".  These job requests are placed in a **queue**, where they wait until the nodes they need are available. A decent real-world analogy is parties of diners waiting for tables at a busy restaurant, where the host person is the batch scheduler.  The difference is that in addition to saying "we need a table with 4 seats" (in our case seats are nodes) parties would also need to give a time limit
("we need 2 hours to eat").

After waiting in the queue, a job is allocated to and started on available
nodes.  Importantly, *jobs are forcefully terminated if they go over their
time limit!*  So if the user's program needs 3 hours to run but the job
only requested 2 hours, the program will not complete successfully. Unless
the program has saved its state to disk while it was running, all is lost
and the program must be restarted from scratch.

---

### Slurm

A well-known batch scheduler is [Slurm](https://slurm.schedmd.com). In
this pedagogic module, we assume that Slurm is installed on a cluster to
which you want to submit jobs.  We picked Slurm due to its popularity, but
the same concepts apply to all batch schedulers.

**Disclaimer**: This module does not provides comprehensive Slurm training, but instead
a gentle introduction to batch scheduling, using Slurm
as an example. You will be only exposed to a small and simplified subset of
the Slurm functionality. This module is only a first step towards
becoming an expert Slurm user.

---

This module assumes that you have basic knowledge of the Linux
command-line.  To get started, just go to the next tab on this page!

---

# TAB #2: Job Submission

## The sbatch command

You were given an account on a batch-scheduled cluster with 10 
nodes. You have logged in to cluster's *head node*, on which you can
run Slurm commands to use the cluster's nodes. The **sbatch** command is
used to submit jobs. It takes a single command-line argument, which is the
name of a "batch script". The batch script specifies the job request, and
in particular the desired number of nodes and duration. 
The first thing for you to learn is how to submit a job. 

## Simulated scenario

In your working directory on the cluster's front-end node there is:
  - An executable called *myprogram*. This is the program you want to run
    on the cluster. This program can run on one or more nodes, each time
    using all the cores on each node. It has the following parallel
    speedup behavior: **It runs in $2 + 20/n$ hours when executed on $n$ nodes**
    (typical Amdahl's Law behavior). So for instance, running 
    *myprogram* on 5 nodes takes 6 hours.
  - A so-called "batch script", stored in file batch.slurm, which is to be
    passed to the Slurm **sbatch**.  This batch script specifies the desired
    number nodes and duration for running *myprogram* as a job on the cluster.

The **sbatch** command is used to submit jobs. It takes a batch script as a
single command-line argument. When invoked, it submits the 
corresponding job to the batch scheduler and prints a job ID after
being invoked, say `job_12`.  

If the job is successful, upon completion a file `job_12.out` is
created, which is the standard output produced by *myprogram*. For 
our purposes, the .out file simple contains a success message. 

If the job is not successful, because the job did not request enough
time, a file `job_12.err` is created that contains some error message. 

In the real world, *myprogram* would generate additional meaningful output
files.  Not that in the activity below you will submit multiple jobs to run
*myprogram*. In the real world, the program would take in some input files,
and you would be running these jobs for different input files.


## Simulation activity

The simulation app at the bottom of this page presents you with a simulated
Linux terminal on the cluster's head node.  Type `help` to get some
guidance. 

Recall that *myprogram* runs in $2 + 20/n$ hours  on $n$ nodes.  Use the app to
do (at least) the following:

  1. Successful job execution
    - Edit the batch script to specify that you want
      to run *myprogram* on 4 nodes (`edit` command). Specify a duration that is sufficient
      for *myprogram* to complete successfully.
    - Submit this job to the batch scheduled and move time forward (`sleep` command) until after the job should have completed. 
    - Double check the content and creation date (`date -r` command) of the .out and/or .err files.
    - Did the job complete?
    - Did it complete about when you thought it would?

  2. Failed job execution

    - Now Submit a job to run *myprogram* on 6 nodes *without* enough requested time, so that it will certainly fail. 
    - Once enough time has passed, double-check the content and creation date of the .out and/or .err files. 
    - Did the job fail? 
    - Did the job about when you thought it would?

  3. Queue waiting time

    - Submit a job to run *myprogram* on 8 nodes with enough requested time so that it will successfully complete.
    - Soon after, submit another job to run *myprogram* successfully again, but using 4 nodes.
    - Without advancing time, estimate the following:
      - the completion time of the first job
      - the wait time of the second job
      - the completion time of the second job
    - Verify your answers to the above questions by advancing the clock!


SIMULATOR GOES HERE: ./TestServer --node 10 --pp_name myprogram --pp_seqwork 7200 --pp_parwork 72000 

---

# TAB #3: Job cancellation and queue

### The scancel and squeue commands

In addition to **sbatch** for submitting jobs, let's now use two other Slurm commands:

  - *scancel* is used to cancel jobs. It takes a job ID as its single 
    command-line argument.

  - *squeue* is used to list all jobs currently in the systems, which are either pending (i.e., submitted but not running yet) or running.


### Simulated scenario

The simulation app at the bottom of this page is similar to that in the
previous tab. In the app on the previous tab, you were the only user on
the cluster. Now, instead, **you are competing with other users!** These
other users submit whatever jobs whenever they want, which is out of your
control. 

### Simulation activity

Recall that *myprogram* runs in $2 + 20/n$ hours  on $n$ nodes.
Use the app to do (at least) the following:

  1. Job submission and cancellation

    - Submit a job to run *myprogram* on 6 nodes successfully. 
    - Soon after submission, inspect the state of the batch queue and answer the following questions:
        - How many jobs are currently pending?
        - How many jobs are currently running?
        - Is your job pending or running?
    - Then simply cancel your job.

  2. Sneaky job submission

    - Inspect the state of the queue and answer the following questions:
        - How many nodes are currently in used by other jobs?
    - Submit a job to run *myprogram* successfully, asking for as many nodes as possible so that your job can run right now (unless another competing job shows up in the nick of time!)
    - Inspect the state of the queue. Is your job running?

SIMULATOR GOES HERE: ./TestServer --node 10 --pp_name myprogram --pp_seqwork 7200 --pp_parwork 72000 --tracefile rightnow


### Take-away 

Inspecting the batch queue to see what one can run right now on idle nodes
can be helpful in practice!

---

# TAB #4: Impact of job durations

In the previous tabs, you were instructed to submit jobs that ask for 
a long enough duration that *myprogram* completes successfully.  You may
have asked for the exact duration needed, or you may have asked for more than needed. 

It turns out that many users, in practice ask for much more time that
needed. This is because they do not know how long their program will run
(for instance, the program runs shorter or longer based on its input data).
Furthermore, users many not know the speedup behavior of their programs. So
although they may know how long the program would run on 1 node, they don't
know how long it will run on 10 nodes.  Since asking for too little time
leads to job failures, most users are conservative and ask for more time.
This behavior has been studied by researchers (here is a [research
article](https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.9.5068&rep=rep1&type=pdf),
if interested).

The problem with asking for too much time is that it can increase a job's wait
time (due to most batch schedulers implementing a strategy called "backfilling", which
allows smaller/shorter jobs to jump ahead in the queue!).  

Let's witness first-hand the impact of the requested job duration using the
simulation app at the bottom of this page.

### Simulation activity

Recall that *myprogram* runs in $2 + 20/n$  on $n$ nodes.
Use the app to do (at least) the following:

  1. Asking for just the right amount of time
    - Feel free to inspect the state of the queue, which will show that all nodes are currently busy.
    - Submit a job asking for 4 nodes and just enough time to run *myprogram* 
    - At what time did the job complete?
  2. Asking for too much time
    - Reset the simulation and resubmit the job, but now asking for 24 hours, pretending to be a user who doesn't know the program's speedup behavior and being conservative
    - At what time did the job complete? 
  3. Exploring
    - Feel free to reset the simulation and resubmit the job with different durations, so see the behavior. The behavior is non-continuous: when asking for one more second, the job's wait time can jump by hours.

SIMULATOR GOES HERE

### Take-away

Jobs that ask for more time can have higher wait times. Therefore, if possible, a job should request just enough time for the user program to complete.


---

# TAB #5: Impact of the number of nodes

Because we know that *myprogram* runs in $2 + 2/n$ hours on $n$ nodes, we
can always ask for the exact duration needed, which is always beneficial .
But what about the number of nodes?  When submitting a job, should we ask
for 1 node, 2 nodes, more? In a previous tab you submitted a job that asked
for whatever number of nodes was currently idle, which is one possible
strategy (and that number may be zero, then what?).

Formally, our goal is to minimize *turn-around time*, which is the sum of
the queue wait time and the execution time.  Asking for more nodes can
increase wait time (because we need to wait for that many nodes to become
available, and also because of backfilling, as mentioned in the previous
tab). But asking for more nodes will shorten execution time.  There is thus
a sweet spot, which, unfortunately, depends on the state of the queue (that
is, on your competitors).

Let try this out with the simulated application at the bottom of
this page, which is similar to that in the previous tab. 

### Simulation activity

Recall that *myprogram* runs in $2 + 20/n$  on $n$ nodes.
Use the app to do (at least) the following:

  1. Inspect the state of the queue. You should see that only 1 node is available right now. 
  2. If you were to submit a 1-node job right now, when would *myprogram* complete? 
  3. Submit a 2-node job, asking for just enough time for *myprogram* to complete successfully.
  4. When does this job complete? 
  5. Reset the simulation and submit a 4-node job, asking for just enough time for *myprogram* to complete successfully.
  6. When does this job complete?
  5. Which option was better: using 1 node, 2 nodes, or 4 nodes? 
  7. Feel free to experiment with different numbers of nodes, so see which one is best.

SIMULATOR GOES HERE

### Take-away 

The question "how many nodes should I ask for to minimize turn-around time?"
is not an easy one.  Asking for too few may hurt turn-around time because
of long execution time. But asking for too many may hurt turn-around
time because of long wait time.


---

NOTES:
    - Batch scheduler provides estimated start times?

