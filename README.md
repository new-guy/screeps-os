# Screeps-OS

The overarching goal here is to build an AI that is driven around running individual processes.  These individual processes will ideally be broken up into small chunks of logic that can reasonably be run independently of one another.  Additionally, we will decide whether or not to run each process based upon the resources available to us - both in terms of CPU and in terms of in-game resources such as Energy or Minerals.

## Tick Loop

Our tick loop is intended to segregate object initialization, functional actions, and state storage into separate stages.  The tick loop looks something like:

1) Load non-process info (such as room objects)

2) Initialize the Scheduler -> Load PID metadata from memory, then sort that set of metadata into an array of processes to run

3) Run the main Scheduler loop
    - Select PID metadata at programCounter (intialized at 0)
    - Check if we have enough non-cpu resources to execute the process
        - If so
            - Pass the PID to the kernel
            - Kernel creates a new process from that PID (the specific process class can be defined in the metadata)
            - Process reaches into Memory.processes[PID] and inits itself from that data
            - Kernel calls process.update()
                This takes actions and updates the process's working memory
            - Kernel calls process.finish()
                - Process stores working memory in Memory.processes[PID]
                - Process returns either "continue" or "exit"
                    - If it's exit, have the scheduler remove that PID from Memory.processMetadata & Memory.processes
    - Increment the program counter
    - Loop again if we have enough CPU to continue

4) Scheduler updates priorities
    - For remaining processes, see if we have enough non-CPU resources to run them.  If so, increment its priority (in the metadata)


## Goals

### MVP

- Able to add processes
- Able to run processes
- Able to add too many processes for one tick and have them run over the course of multiple ticks


### V1

- Able to add subprocesses
- Able to postpone running processes because we don't have enough resources
    - Need to be able to assign different amounts of resources based upon different criteria.  Initially just different resources per class type.  For example, gatherers vs combat.  Eventually we need to do that on the room AND role level
- Able to have processes sleep