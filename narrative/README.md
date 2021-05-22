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
physical machines.  In the field of High Performance Computing, a typical
way to allow this sharing is with a **batch scheduler**.

Consider a cluster of homogeneous compute nodes (or just "nodes").  A batch
scheduler is a software service that allows users to submit **jobs** to the
cluster. Submitting jobs is typically the only way for users to access the
cluster's nodes.  Each job specifies a desired *number of nodes*, a desired
*duration*, and a program to run on these nodes. For instance, a job can
say: "I need 4 nodes for 2 hours".  These job requests are placed in a
**queue**, where they wait until the nodes they need are available. A
decent real-world analogy is parties of diners waiting for tables at a busy
restaurant, where the host person is the batch scheduler.  The difference
is that in addition to saying "we need a table with 4 seats" (in our case
seats are nodes) parties would also need to give a time limit ("we need 2
hours to eat").

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

You were given an account on a **batch-scheduled cluster with 32 nodes**. You
have logged in to cluster's *head node*, on which you can run Slurm
commands to use the cluster's nodes. The `sbatch` command is used to
submit jobs. It takes a single command-line argument, which is the name of
a "batch script". The batch script specifies the job request, and in
particular the desired number of nodes and duration.  The first thing for
you to learn is how to submit a job.

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

The `sbatch` command is used to submit jobs. It takes a batch script as a
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
Linux terminal on the cluster's head node.  **Type `help` to get some
guidance.**

Recall that *myprogram* runs in $2 + 20/n$ hours  on $n$ nodes.  Use the app to
do (at least) the following:

1. **Successful job execution**

    - Edit the batch script to specify that you want
      to run *myprogram* on 4 nodes (`edit` command). Specify a duration that is sufficient
      for *myprogram* to complete successfully.
    - Submit this job to the batch scheduled and move time forward (using `sleep` command) until after the job should have completed. 
    - Check the content of the generated .out or .err file produced by the job.
    - Did the job complete successfully?
    - At what time did it complete? 
    - Did it complete about when you thought it would?


  2. **Failed job execution**

    - Now Submit a job to run *myprogram* on 6 nodes *without* enough requested time, so that it will certainly fail. 
    - Once enough time has passed, check the content of the generated .out or .err file. 
    - Did the job fail? 
    - At what time did it fail? 
    - Did the job file about when you thought it would?


Just run the following Docker container:   

```
docker run -p 8080:8080 --rm -it wrenchproject/eduwrench-slurm-terminal ./run_it.sh tab2
```

You can now point your Web browser to ` http://localhost:8080`

---

# TAB #3: The batch queue

## The squeue command


The main goal of a batch scheduler is to place job requests in a *batch queue*, in which they wait for available resources. This is because resources are *space-shared*, i.e., not two jobs run can use the same compute node.  Note that Slurm can be configured not to enforce this requirement, but in all that follow we assume that it does (which is typical in production systems). 

The term **turn-around time** is typically used to denote the sum of the wait time and of the execution time. For instance, say you submit a job that executes for 2 hours, but that spent 10 hours in the batch queue before being able to execute. The job's turn-around time is 10 + 2 = 12 hours.  In other words, the turn-around time is the time between submission and completion. 

In the previous tab, your job ran immediately because there was no other job in the system. So their wait time was zero, and their turn-around time was exactly equal to their execution time.  Let's change that and showcase another useful Slurm command:
   - `squeue` is used to list all jobs currently in the systems, which are either pending (i.e., submitted but not running yet) or running.


## Simulation activity

The simulation app at the bottom of this page presents you with a simulated
Linux terminal on the cluster's head node.  **Type `help` to get some
guidance.**

Recall that the cluster has 32 compute nodes, and that *myprogram* runs in $2 + 20/n$ hours  on $n$ nodes.  Use the app to do (at least) the following:
    - Submit a job to run *myprogram* on 25 nodes with enough requested time so that it will successfully complete.
    - Use `squeue` to inspect the state of the batch queue. You should see that your job is running.
    - Soon after, submit another job to run *myprogram* successfully again (you can modify the same .slurm file, or copy it), but using 10 nodes.
    - Use `squeue` to inspect the state of the batch queue. You should see that your second job is "stuck" in the queue, waiting for the first job to complete. 
    - Without advancing time, estimate the following:
      - the turn-around time of the first job
      - the turn-around time of the second job
    - Verify your answers to the above questions by advancing the clock and checking content of the generated .out files.


If you haven't done so already, pull the following Docker container:   

Just run the following Docker container:   

```
docker run -p 8080:8080 --rm -it wrenchproject/eduwrench-slurm-terminal ./run_it.sh tab3
```

You can now point your Web browser to ` http://localhost:8080`



---

# TAB #4: Job cancellation 

### The scancel commands

In addition to `sbatch` for submitting jobs, let's now use a command to cancel a job: 

  - `scancel` is used to cancel jobs. It takes a job ID as its single 
    command-line argument.


### Simulation activity

The simulation app at the bottom of this page presents you with a simulated
Linux terminal on the cluster's head node.  **Type `help` to get some
guidance.**

In the previous tab, you were the only user on the cluster.
Now, instead, **you are competing with other users!** These other users
submit whatever jobs whenever they want, which is out of your control.

Recall that the cluster has 32 compute nodes, and that *myprogram* runs in $2 + 20/n$ hours  on $n$ nodes.  Use the app to do (at least) the following:

  1. **Job submission and cancellation**
    - Submit a job to run *myprogram* on 16 nodes with enough requested time.
    - Soon after submission, inspect the state of the batch queue and answer the following questions:
        - How many jobs are currently pending?
        - How many jobs are currently running?
        - Is your job pending or running? (your username is `slurm_user`)
    - Advance simulation time until your job has completed. You'll have to advance time by quite a lot. Imagine what it would be in the real world where, unlike in simulation, you can't fast-forward time (if you can, contact us immediately!)
    - What was your job's wait time? (you can infer it based on the time of submission and the time of completion, since you know the execution time)

  2. **Sneaky job submission**
    - Reset the time to zero, to pretend the above never happened.
    - Inspect the state of the queue and answer the following questions:
        - How many nodes are currently in used by running jobs?
        - How many nodes are currently idle?
    - Submit a job to run *myprogram* successfully, asking for as many nodes as possible so that your job can run right now (unless another competing job shows up in the nick of time!)
    - Inspect the state of the queue. Is your job running?
    - Advance time until your job completes
    - Compare an contrast your job turn-around time with that in the previous question.

Just run the following Docker container:   

```
docker run -p 8080:8080 --rm -it wrenchproject/eduwrench-slurm-terminal ./run_it.sh tab4
```

You can now point your Web browser to ` http://localhost:8080`


### Take-away 

Inspecting the batch queue to see what one can run right now on idle nodes
can be helpful in practice! Sometimes, less is more (i.e., asking for fewer resources can get the job done faster due to competition with other jobs). 

---

# TAB #5: Impact of job durations

In the previous tabs, you were instructed to submit jobs that ask for a
long enough duration that *myprogram* completes successfully.  You may have
asked for the exact duration needed, or you may have asked for more than
needed.

It turns out that many users, in practice ask for much more time that
needed. This is because they do not know how long their programs will run
(for instance, the program runs shorter or longer based on its input data).
Furthermore, users many not know the speedup behavior of their programs. So
although they may know how long the program would run on 1 node, they don't
know how long it will run on 10 nodes.  Since asking for too little time
leads to job failures, most users are conservative and ask for more time.
This behavior has been studied by researchers (here is a [research
article](https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.9.5068&rep=rep1&type=pdf),
if interested).

The problem with asking for too much time is that it can increase a job's
wait time. This is because most batch schedulers implementing a strategy called
"backfilling", which allows smaller/shorter jobs to jump ahead in the
queue!

Let's witness first-hand the impact of the requested job duration using the
simulation app at the bottom of this page.

### Simulation activity

Recall that the cluster has 32 compute nodes, and that *myprogram* runs in $2 + 20/n$ hours  on $n$ nodes.  
Use the app to do (at least) the following:


  1. Asking for just the right amount of time
    - Feel free to inspect the state of the queue, which will show that all nodes are currently busy.
    - Submit a job asking for 16 nodes and just enough time to run *myprogram* 
    - What is the job's turn-around time?
  2. Asking for too much time
    - Reset the simulation time.
    - Resubmit the job, but now asking for 22 hours, pretending to be a user who doesn't know the program's speedup behavior and conservatively asks for the sequential time
    - What is the job's turn-around time? 
  3. Exploring
    - Feel free to reset the simulation and resubmit the job with different durations, so see the behavior. The behavior is non-continuous: when asking for one more second, the job's wait time can jump by hours!


Just run the following Docker container:   

```
docker run -p 8080:8080 --rm -it wrenchproject/eduwrench-slurm-terminal ./run_it.sh tab2
```

You can now point your Web browser to ` http://localhost:8080`


### Take-away

Jobs that ask for more time can have higher wait times. Therefore, if possible, 
a job should request just enough time for the user program to complete.


---

# TAB #6: Impact of the number of nodes

Because we know that *myprogram* runs in $2 + 2/n$ hours on $n$ nodes, we
can always ask for the exact duration needed, 
which is never detrimental and often beneficial.
But what about the number of nodes?  When submitting a job, should we ask
for 1 node, 2 nodes, more? In an earlier tab you submitted a job that asked
for whatever number of nodes was currently idle, which is one possible
strategy. But that number may be zero, so then what? That was the case
in the previous tab, and the activity just said "ask for 16 nodes". But would
17 nodes have led to some benefit? Or would it have instead been a worse choice?

Formally, our goal is to *minimize turn-around time*.  Asking for more nodes can
increase wait time (because we need to wait for that many nodes to become
available).  But asking for more nodes will shorten execution time because
parallelism is good.  There is thus  a sweet spot. This sweet spot, unfortunately, depends on the state of the queue, that is,
on your competitors, which is out of your control. So all 
users of batch-scheduled platforms try to optimize their turn-around
times on a daily basis, but are mostly in the dark.  Let get a sense for this in simulation...

### Simulation activity

Recall that the cluster has 32 compute nodes, and that *myprogram* runs in $2 + 20/n$ hours  on $n$ nodes.  
Use the app to do (at least) the following:

  1. Inspect the state of the queue. You should see that only 1 node is available right now. 
  2. If you were to submit a 1-node job right now, why turn-around time would you experience? 
  3. Submit a 2-node job, asking for just enough time for *myprogram* to complete successfully.
  4. What is this job's turn-around time? 
  5. Reset the simulation and submit a 4-node job, asking for just enough time for *myprogram* to complete successfully.
  6. When is this job's turn-around time?
  5. Which option was better: using 1 node, 2 nodes, or 4 nodes?
  6. Is there any way you could have predicted this based on initial state of the batch queue?  
  7. Feel free to experiment with different numbers of nodes, so see which one is best.


Just run the following Docker container:   

```
docker run -p 8080:8080 --rm -it wrenchproject/eduwrench-slurm-terminal ./run_it.sh tab6
```

You can now point your Web browser to ` http://localhost:8080`


### Take-away 

The question "how many nodes should I ask for to minimize turn-around time?"
is not an easy one.  Asking for too few may hurt turn-around time because
of long execution time. But asking for too many may hurt turn-around
time because of long wait time. 


---
