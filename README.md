# Screeps-OS

The overarching goal here is to build an AI that is driven around running individual processes.  These individual processes will ideally be broken up into small chunks of logic that can reasonably be run independently of one another.  Additionally, we will decide whether or not to run each process based upon the resources available to us - both in terms of CPU and in terms of in-game resources such as Energy or Minerals.

## Tick Loop - sorta out of date

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

## OS Notes

### Creating a new process

- Copy the ExampleProcess.js class
- Give it an exit condition
- If it is going to create any child processes, use the ensureChildProcess command

### Priority

Anything at or above 1000 stays where it is.  Nothing can be promoted above 1000.  This is used for processes that _need_ to run at or near the beginning of every tick.

### IPC

Each IPC object should have an array with a list of PIDs that use the IPC object.  GC should check each IPC object once in a while and see if there are any processes that are still using it, then delete it if not.

### Children

Processes need to keep track of their own created child processes.  This is used for child process cleanup

## Goals

### MVP

- Able to add processes
- Able to run processes

- Process is by default for long lived tasks
- Extend it with a process that is for running one-tick functions

### OS-V1

- Able to add subprocesses - Scheduler needs both an "add subprocess" and an "add process" function - they should add the processes to both Memory.processMetadata, and to the current set of processes being run
    - have EmpireManager ensure ColonyManager for each room that we have spawns in.  Eventually we can have the ability to designate a room as not being a separate colony.
    - Subprocess add function will use two parts - adding the subprocess to the processmetadata object, and adding it to the current processArray

### Heartbeat

- ColonyManager ensures a BootstrapSpawner process when no storage exists
    - Deleting the ColonyManager should delete the BootstrapSpawner, but deleting the BootstrapSpawner should not delete the process for the bootstrapper creep.  BootstrapSpawner is a child of ColonyManager, but the bootstrapper creep can exist on its own, so it should not be a child process

- Name-based spawning logic - use a Colony level spawnCreep function.
- Able to have processes sleep
- Able to sleep the BootstrapSpawner prcess when there are no available spawners in the Colony.
- Bootstrapper creep needs to find a source with energy and an open spot, harvest, then build.  If there isn't one in this room, travel to an adjacent room

### CPU Conservation & Resource handling

- Able to skip running processes & promote their priority if we're low on CPU (have this theshold be controlled by a CONSTANT so that we can test out the functionality);
- Able to postpone running processes till the next tick because we don't have enough resources
    - Need a getCost() function for the process to allow it to calculate and return its cost
    - Need to be able to assign different amounts of resources based upon different criteria.  Initially just different resources per class type.  For example, gatherers vs combat.  Eventually we need to do that on the Colony AND role/objective (meaning attack, defend, economy) level
- Able to add too many processes for one tick and have them run over the course of multiple ticks
- Keep track of CPU usage for each process type.

### Building Creation

- Put the building creation logic from the old AI in here.