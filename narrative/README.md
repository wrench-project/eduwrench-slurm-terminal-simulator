# Draft Pedagogic Module Narrative
---

Content below is text that will eventually find its way into EduWRENCH.

---

# TAB #1

### Basic Concept

Large compute platforms cost a lot of money, not only for initial hardware purchases and ongoing
maintenance, but also in terms of electrical power cost.  Therefore, in most organizations, these
platforms are *shared* among users. There are several ways in which this sharing can be done
depending on the context. For instance, cloud providers allow transparent sharing by giving user
virtual machine instances that transparently run on the physical machines.  In the field of High
Performance Computing, a traditional way to allow this sharing is with a **batch scheduler**.

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

A batch scheduler implementations is
[Slurm](https://slurm.schedmd.com). In this pedagogic module, we assume
that Slurm is installed on a cluster to which you want to submit jobs. You
will be presented with a tiny and simplified subset of the Slurm
command-line interface, but a sufficient subset to understand most
of the relevant concepts needed and issues faced by users of batch
schedulers.  Although in this pedagogic module we picked Slurm as our batch
scheduler due to its popularity, the same concepts and issues apply to all
batch schedulers.

To get started, just go to the next tab on this page!

---


# TAB #2

