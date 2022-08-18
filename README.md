# Screeps-OS

The overarching goal here is to build an AI that is driven around running individual processes.  These individual processes will ideally be broken up into small chunks of logic that can reasonably be run independently of one another.  Additionally, we will decide whether or not to run each process based upon the resources available to us - both in terms of CPU and in terms of in-game resources such as Energy or Minerals.

## Getting Started

- brew install npm nvm
- mkdir server && cd server
- nvm install v12.22.10
- nvm use v12.22.10
- npm install screeps
- npx screeps init

- npx screeps server to run locally
- npx screeps cli to get local cli

- sh start_server.sh (you might need to use ifconfig to get your IP and update this)
- sh start_cli.sh in new window
- start the client in steam and connect to logged server address

- place a spawn
- run deploy_[env]

## Codebase best practices
- Use `== null` and `!= null` instead of `=== undefined` and `!== undefined`

## How to play

### Respawning
- Place the spawn
- Increase GCL: `storage.db['users'].update({ username: 'asdf' },{ $set: { gcl: 50000000 }})`
- Increase RCL: `storage.db['rooms.objects'].update({ _id: 'idOfController' },{ $set: { level: 4 }})`

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

If we're above the high watermark, use up to 80% of the tickLimit
If we're below the high watermark, use up to 90% of the limit
If we're below the low watermark, use up to 50% of the limit

## Goals

### MMO Ready

### Post RCL4 - Roads

- We've made a roadmap object per room in the colony in colonyInfo
    - Can take in a room position and tell us if it is reserved for a road
    - Can accept updates to designate road positions in a room

- We are generating roads from roadmap
    - Just check every N ticks for each room to see if all of its roads are placed
        - Store the last tick it was check at in roomInfo
    - If not, place them

- New builders have been implemented
    - Colony-tier builders (get rid of room-tier)
    - Pick up energy from nearest non-empty storage
    - Room construction/repair priority
        - Go to room that needs critical repairs
        - Build/repair in current room
        - Build in room that most needs construction

- We need to implement road maintenance
    - Only add a road to the room's set of roads needing repair if the road is on the roadmap

- Once we have road maintenace, we need to start automatically creating the roads
    - Start by drawing roads between the primary and secondary room
    - Then draw roads from storage to controller
    - Then draw roads one by one to active mining routes

- Add roads that are defined in construction to the roadmap
    - Have an "Add Planned Roads" function in Colony.js that looks through each colonyRoom's buildingPlan and adds each road to the roadmap
        - For each room in the colony's list of rooms
            - Open up the building plan
                - For each x & y
                    - If it's 'road', add it to the roadmap

### MMO Readiness
- Need invader defense - one defender per colony
- Need Link transferring
- Ship energy from secondary to primary pre-RCL7, and back the other way until they're both at 7

### Post RCL4 - Scouting & Remote Improvements
- Scouts need to be able to recognize when a room is unreachable and stop sending scouts there for N ticks
- Avoid mining rooms that are owned by other people

### Post RCL4 - Expansion & Housekeeping

- Need to be able to create a new colony and bootstrap it to RCL2
- Once we hit RCL4 in both bases, have the secondary feed the primary till the primary is RCL7
- Creeps that have nothing else to do should recycle themselves
    - Could have them go to the !BALSTART flag next to the storage, then die and have the balancer pick up their energy
        - Balancer checks if there's energy on the ground.  If balancer is full, have it store its current energy

### Post RCL4 - Stuff from old code

- Terminals

### Tidy UP pt 2

- Move room and creep property initialization somewhere better than main.js
- Move room tools from HRCT to RT
- Break logic in PCFM into smaller parts
- Need a consistent process naming scheme
- Combine room tools getConstructionSite & constructionSiteExists

### Tidy UP pt 3

- Update mining route discovery to perform route discovery as a separate function, or cache the known paths
- Ensure that we have unique and consistent PIDs.  Bootstrapper spawning, for example, is inconsistent
- Mining Mangers should remove mining routes that have been inoperational for N ticks

### Post RCL4 - this is (duh) big.

## Things we need

- Need a generic way of creating states, transitions, etc
- Probably need to set process default priority by some sort of dictionary rather than depending on the process to be honest - this will allow us to update priorities without recreating the process tree.
- Test out that CPU conservation works
- Whitelisting for enemy buildings
- Building plans should be an object like roadmaps

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