# Screeps-OS

The overarching goal here is to build an AI that is driven around running individual processes.  These individual processes will ideally be broken up into small chunks of logic that can reasonably be run independently of one another.  Additionally, we will decide whether or not to run each process based upon the resources available to us - both in terms of CPU and in terms of in-game resources such as Energy or Minerals.

## How to play

### Respawning
- Place the spawn

### High Level Controls
- Building - !CHUNK|chunktype|UID
	- Chunktypes are defined in constructionSiteManager.  Also there are some pictures of them
	- Chunks are placed automatically, but we can only place one new chunk per RCL because we don't include future building locations in our chunk calculations
	- Force recalculation with Room.prototype.forceBuildingRegeneration()

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

### CPU Usage 

If we're above the high watermark, use up to 90% of the tickLimit
If we're below the high watermark, use up to 90% of the limit
If we're below the low watermark, use up to 50% of the limit

## Goals

### Room Pairs <--------------- current

- Remaining work:
    - Need to set up the support back and forth 
        - Primary helps secondary get started
        - Secondary gets up to level 2, then puts itself on minimal bootstrap
        - Secondary helps Primary after level 2 until Primary is level 4
        - Primary helps Secondary up to level 4
        - "help" in this context means sends bootstrappers
    
    - Need a coma recovery process for both rooms 
        - Current one is shit.  We should be checking for coma and stopping all spawning if we are in coma
    - Move construction room manager and construction flag converter into homeRoomManager

### Post RCL4 - Bootstrappers + Miners

- While in coma post RCL4, we spawn bootstrappers and mining routes one by one.
- Start off with spawning bootstrappers
    - Coma bootstrappers
- Then figure out mining route logic
    - Each mining operation should be its own process
        - Update the "Ensure Child Process" function so that it returns the child process if it exists
        - The mining route process should be able to return information about the mining route, such as if it is in full operation
    - Colonies should have a mining manager process which controls the mining operations
        - Mining routes should be created
            - High priority for the room's own sources
            - Up to a maximum number of ticks per spawner
                - This should be able to be controlled by a variable so that we can control it based upon state
                - We need to know how many ticks a mining operation will consume
        - Mining operations should be started one by one.  New mining operations should only be started when the previous has all of its creeps being spawned or in existence
        - To create a route, have the manager check the colony's available sources (meaning not owned by SKs or other players) by order of nearest to either of the colony's storages one by one
            - If there is a route for that source already, continue
            - If there is not a route, create one.
            - If we can't find any available sources, tell the colony that we need to scout
    - Miners should just go to their assigned source, make sure a container is built, and mine
    - Haulers should pick up from their assigned source, then deposit in the closest storage (this value should be cached)

### Post RCL4 - Upgraders
- Just do feeders + upgraders
    - Spawn N if over X energy
    - Spawn 1 if under X
    - Spawn size 1,1,1 if in coma
- 

### Post RCL4 - Roads

### Post RCL4 - Secondary Room Improvements

- Favor 2 sources over 1
- Update scouting to include the secondary room
- When spawning
    - If no energy max defined, spawn from biggest available spawner
    - If energy max defined, spawn from smallest that can support it
- Delete all mining routes every N ticksr
- Update mining route creator to use scouting info rather than looking at sources that are visible

### Tidy UP pt 2

- Move room and creep property initialization somewhere better than main.js
- Move room tools from HRCT to RT
- Break logic in PCFM into smaller parts
- Remove creep process delay
- Need a consistent process naming scheme
- Combine room tools getConstructionSite & constructionSiteExists

### MMO Ready

- Need defenses
- We just need to be at the point where we can start to establish a room on the mmo

### Tidy UP pt 3

- Update mining route discovery to perform route discovery as a separate function, or cache the known paths

### Post RCL4 - this is (duh) big.

We enter coma immediately.  Coma recovery should be bootstrappers + mining route introduction

1) Start with bootstrappers + mining routes
2) Then move on to new balancers + all of the old creeps

WE JUST WANT TO GET THINGS TO PAR WITH THE PREVIOUS AI WHILE STILL KEEPING GOOD QUALITY

### Defenses
    - Just do a rampart + wall alternating defense (maybe r-r-w-w-r-r-w-w)
    - Second row of ramparts behind
    - Ramparts on top of all important buildings

## Things we need

- Need a generic way of creating states, transitions, etc
- Probably need to set process default priority by some sort of dictionary rather than depending on the process to be honest - this will allow us to update priorities without recreating the process tree.
- Test out that CPU conservation works
- Whitelisting for enemy buildings

### Notes on what to build

- Room Pairs
    - Only do this if we have enough GCL
    - Designate one as the primary and one as the secondary
        - This is only used for upgrading.  Once both are RCL7, we should not treat them any differently
    - Spawns from both are available to the colony
    - High level plan for pair building
        - Upon primary being above RCL2, us having enough GCL, and secondary room not being set
            - Scout for adjacent room for Secondary
            - If we can find a place to put its heart, it's a valid candidate
            - Select the one with the most "plains" territory
            - Send bootstrappers from primary.  Process dies when secondary's spawn is built
        - Primary should be focused to RCL4
            - Create a process specifically for bootstrappers for primary
            - Second process to create individual bootstrapper for secondary
        - Secondary should be focused to RCL4
            - Reverse of above
        - Primary should be focused to RCL7
        - Secondary should be focused to RCL7

- Scouting
    - Colonies need to understand rooms that are nearby.  This means that it needs to automatically scout rooms.
        - Maybe have two different scouting control processes - one for when we have observer, and one for not.  Start with the latter (duh)
        - Colonies need a memory object to keep track of scouting reports.  Something like 

        {
            "reportTime": Game.tick when created,
            "info": {
                //Info that's created by the scouting process
            }
        }
    - Need to automatically add sources in nearby rooms to the list of available sources.  This needs that the colony object needs to automatically send scouts outside of the room

- Mining

- Colony/Room States
    - We effectively have two types of creeps - the necessary ones and the "gravy" ones
    - We need to first ensure that rooms are trying to spawn the necessary ones
    - Then, based upon room state, we spawn the gravy
    - State is determine based upon different factors.  Whenever states change, though, we need to kill all of the processes from the previous state (they should all be children of that state), then start up the new state