## Plan
1. Terminal -> Terminal Transfer
    - Empire-level process
2. Terminal -> Storage Transfer
3. Use generic haulResourceFromSourceToSink wherever possible
4. Use the cartographer library
5. Terminal "sell to market if over threshold" logic
    - Need some empire-level logic to control this
    - Start off by just selling 10% of pixels
    - Keep track of profits by colony and empire
6. Make RoomHauler handle link filling, terminal filling, tower filling
7. Keep track of profit made by room and allow it to spend some percentage of that on energy/resource imports
8. Get rid of primary/secondary room distinction - just have an array of rooms that are claimed in the colony
9. Get rid of link flags
10. Command to transfer room from one colony to another
11. Ability to force spawns to use a minimum amount of energy
    - Also bodyType min isn't respected
12. Actually frickin define creep abilities in the abilities dir & use them.  The "advanced do this thing" pattern is neat
13. Make CreepSpawner less verbose & cleaner to define
    - Need to have a common method for naming creeps 
14. Display information about attacks with mapvisuals
15. Allow more base designs
16. Create common library for creeps to talk with
17. Error handling - catch error and throw it at the end of processing
18. Make generic state machine process that Colony, RoomManager, CreepProcess, and MultiCreepProcess inherit from
19. This.creep.memory comes from process.memory.creepmemory or some shit.  That means it's doubled up unnecessarily.  Potentially stop referencing creep memory

### Important New Features
- Make the creeps actually walk on roads without avoiding each other

### Records
Ticks remaining in Safe mode
- RCL3 
    - Baseline: 8500
    - Pass 1: 10500
- RCL4
    - Pass 1:

### Refactors
- Make HomeRoomConstructionTools more DRY
- Generic "move to target" function & state?  Would be good to not have to keep rewriting it
- Do we differentiate between secondary and primary too much? Should we instead just be treating them the same in the code more?
    - Probably should minimize the differentiation in general to help simplify things
        - We reference the word "secondary" 178 times :|
    - We get so much fucking complexity from having primary and secondary so thoroughly in the code.  Need to remove that logic wherever we can

### Fixes
- Document how the friggin OS actually works
