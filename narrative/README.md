NOTES:
# Draft Pedagogic Module Narrative
---

Content below is text that will eventually find its way into EduWRENCH.

---

# TAB #1: Basic Concepts

### Batch schedulers

Large parallel platforms cost a lot of money, not only for initial hardware
purchases and ongoing maintenance, but also in terms of electrical power
cost.  Therefore, in most organizations, these platforms are *shared* among
users. There are several ways in which this sharing can be done depending
on the context. For instance, cloud providers allow transparent sharing by
giving user virtual machine instances that transparently run on the
physical machines.  In the field of High Performance Computing, a
traditional way to allow this sharing is with a **batch scheduler**.

Consider a cluster of homogeneous multi-core compute nodes.  A batch
scheduler is a software service that allows users to submit **jobs** to the
cluster, which is typically the only way for users to access the cluster's
compute nodes.  Each job specifies a desired *number of compute nodes* and
a desired *duration*. For instance, a job can say: "I need
4 nodes for 2 hours".  These jobs are placed in a **queue**, where they
wait until the nodes they need are available. A decent real-world
analogy is exactly like parties of diners waiting for tables at a busy restaurant,
where the host person is the batch scheduler. The difference is that in
addition to saying "we need a table with 4 seats" (in our case
seats are nodes) parties would also need to give a time limit ("we
need 2 hours to eat"). 

After waiting some time in the queue, a job is allocated the nodes it
requested. At that point, the user's program is started on these nodes.
Importantly, *jobs are forcefully terminated if they go over their time
limit!*  So if the user's program needs 3 hours to run but the job only
requested 2 hours, the program will not complete successfully. Unless the
program has saved some of it state to some disk while it was running, all
is lost and the program must be restarted from scratch.

---

### Slurm

A batch scheduler implementations is [Slurm](https://slurm.schedmd.com). In
this pedagogic module, we assume that Slurm is installed on a cluster to
which you want to submit jobs.  We picked Slurm due to its popularity, but
the same concepts apply to all batch schedulers.

**Disclaimer**: This module in no way provides comprehensive Slurm training. 
The intent is to introduce you to batch scheduling in general, merely using Slurm
as an example. *And in fact, you will be only exposed to a small
and simplified subset of the Slurm functionality.*

---

This module assumes that you have very basic knowledge of the Linux
command-line.  To get started, just go to the next tab on this page!

---

# TAB #2: Job Submission

## The sbatch command

You were given an account on a batch-scheduled cluster with 10 compute
nodes. You have logged in to cluster's *frontend node*, on which you can
run Slurm commands to use the cluster's nodes. The **sbatch** command is
used to submit jobs. It takes a single command-line argument, which is the
name of a "batch script". The batch script specifies the job request, an
in particular the desired number of compute nodes and the desired duration. 
The first thing for you to learn is how to submit a job to the batch
scheduler and see it complete or fail.

## Simulated scenario

On the The simulation app at the bottom of this page presents you with a
very limited (fake) Linux terminal for the cluster's frontend node.  Only a
few commands are supported: cat, rm, XX, edit, and **sbatch**.

In the working
directory there is:
  - An executable called *myprogram* which is the program you want to run
    on the cluster. This program can run on one or more nodes, each time
    using all the cores on the nodes. It has the following parallel
    speedup behavior: **It runs in $2 + 20/n$ hours when executed on $n$ nodes**
    (this is a atypical Amdahl's Law behavior). So for instance, running 
    *myprogram* on 5 nodes takes 6 hours.
  - A batch script called XXX.slurm, which is to be passed to the sbatch
    command. You can edit this batch script using the **edit**
    command to specify a desired number of nodes and duration. 

The sbatch command prints an integer job ID after being invoked, say 1234.
When the job completes successfully, a 1234.out file is produced with some
success message. In the real world, *myprogram* would produce some
meaningful output data.  When the job fails, a 1234.err file is produced
with some failure message. Also, we run the *myprogram* multiple times.  In
the real

## Simulation activity

The simulation app at the bottom of this page presents you with a very
limited (fake) Linux terminal for the cluster's frontend node.  Only a few
commands are supported: cat, rm, XX, edit, and **sbatch**.  It also shows
you the simulated time of the day, and makes it possible for you to advance
in time at will.

Use the app to do (at least) the following:

  1. Successful job execution

    - Submit a job to run *myprogram* on 4 compute nodes with enough requested time so that it can successfully complete. Double check the content of the .out and .err files.
    - Does *myprogram* complete about when you thought it would?

  2. Failed job execution

    - Submit a job to run *myprogram* on 6 compute nodes without enough requested time so that it will certainly fail. Double-check the content of the .out and .err files. 
    - Does *myprogram* fail about when you thought it would?

  3. Queue waiting time

    - Submit a job to run *myprogram* on 8 compute nodes with enough requested time so that it will successfully complete
    - Soon after, submit another job to run *myprogram* again, but 4 compute node so that it will successfully complete
    - Without advancing time, estimate the following:
      - the completion time of the first job
      - the wait time of the second job
      - the completion time of the second job
    - Verify your answers to the above questions by advancing the clock!


SIMULATOR GOES HERE

---

# TAB #3: Job cancelation and queue

### The scancel and squeue commands

In addition to **sbatch** for submitting jobs, let's now use:

  - *scancel* is used to cancel jobs. It takes an integer job ID as its single 
    command-line argument.

  - *squeue* is used to list all jobs currently in the systems, which are either pending (i.e., submitted but not running yet) or running


### Simulated scenario

The simulation app at the bottom of this page is similar to that in the
previous tab. In the app on the previous tab, you were the only user on
on the cluster. Now, instead, you are competing with other users! These
other users submit whatever jobs whenever they want, which is out of your
control. 

### Simulation activity

Use the app to do (at least) the following:

  1. Job submission and cancellation

    - Submit a job to run *myprogram* on 6 compute nodes with enough requested time so that it can successfully complete.
    - Soon after submission, inspect the state of the batch queue and answer the following questions:
        - How many jobs are currently pending?
        - How many jobs are currently running?
        - Is your job pending or running?
    - Cancel your job

  2. Sneaky job submission

    - Reset the simulation to be back to the initial state
    - Inspect the state of the queue and answer the following questions:
        - How many compute nodes are currently used by the jobs?
    - Submit a job to run *myprogram* asking for as many compute nodes as possible so that your job can run hopefully right now (unless another competing job shows up in the nick of time!)
    - Inspect the state of the queue. Is your job running?

---

# TAB #4: Job crafting


TODO


---

# TAB #5: Job flooding

TODO

---






