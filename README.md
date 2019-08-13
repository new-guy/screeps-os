# Screeps-OS

The overarching goal here is to build an AI that is driven around running individual processes.  These individual processes will ideally be broken up into small chunks of logic that can reasonably be run independently of one another.  Additionally, we will decide whether or not to run each process based upon the resources available to us - both in terms of CPU and in terms of in-game resources such as Energy or Minerals.

## How to play

### Respawning
- Look at the current heart definition picture to see how far you need to space things
- Place the spawn & put !CHUNK|heart|ROOMNAME over it

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

### Colony Scouting

- Create a colony scouting process that automatically sends out scouts whenever our scouting info is old
    - For each roomName in our list of colonyRoom
        - Do we have vision on it?
            - Update our info on it & update [SCOUTING_INFO].colonyScouted
        - Need to check if the scouting info exists
            - If not, send scout
            - If so, and the last time we [SCOUTING_INFO].colonyScouted is past MAX_SCOUT_INTERVAL
                - send scout
    - Store room info in memory:
        - room-level distance (how many rooms do I need to cross to get here?)
    - Store scouting info in memory:
        - How far away the sources are from the two different rooms' hearts
        - Source location
        - Whether or not it is an SK room

!!! Fixing bootstrappers
- Set up a function "RoomPosition.multiRoomFindClosestByPath([objects w/ roompositions] or [roompositions])"
    - Function that takes in an array of room positions/objects, then uses https://docs.screeps.com/api/#PathFinder.search to check them one by one to see which is closest, and returns that.

- Set up bootstrappers to use that new function if we have available sources
- Otherwise, bootstrappers need to head to an adjacent room that isn't an SK room

### Towers

- Implement whitelisting
    - Creep.prototype.isWhitelisted() -> check if the creep's owner is on a whitelist (or is me!)
    - Room.prototype.enemyCreeps -> FIND_CREEPS and use custom function to see if they are on whitelist
- BootStrappers fill towers
- Towers prioritize killing creeps
- Towers heal own creeps otherwise
- Towers repair roads

### Room Pairs

- Things to update
    - Colony Scouting: We need to update source distance from heart of supporting room
    - Colony homeroom should be renamed to colony primary room

### Tidy UP pt 2

- Move room and creep property initialization somewhere better than main.js
- Move room tools from HRCT to RT
- Break logic in PCFM into smaller parts

### Scouting Improvements

- Why are scouts spawning that never move?
- Scouts should dodge source keepers - add a move tool for avoiding SKs

## Things we need

- Need a generic way of creating states, transitions, etc
- Probably need to set process default priority by some sort of dictionary rather than depending on the process to be honest - this will allow us to update priorities without recreating the process tree.
- Test out that CPU conservation works

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
    - Each mining operation should be its own process
    - Colonies should have a mining manager process which controls the mining operations
        - Mining operations should be started one by one.  New mining operations should only be started when the previous has all of its creeps being spawned or in existence
        - New mining operations should only be created if the room is in the right state, and if there's room in the queue.  
        - If we have a pair of rooms, we need to force the destination
        - To create a route, have the manager check the colony's available sources (meaning not owned by SKs or other players) by order of nearest to either of the colony's storages one by one
            - If there is a route for that source already, continue
            - If there is not a route, create one.
            - If we can't find any available sources, tell the colony that we need to scout
    - Miners should just go to their assigned source, make sure a container is built, and mine
    - Haulers should pick up from their assigned source, then deposit in the closest storage (this value should be cached)

- Colony/Room States
    - We effectively have two types of creeps - the necessary ones and the "gravy" ones
    - We need to first ensure that rooms are trying to spawn the necessary ones
    - Then, based upon room state, we spawn the gravy
    - State is determine based upon different factors.  Whenever states change, though, we need to kill all of the processes from the previous state (they should all be children of that state), then start up the new state