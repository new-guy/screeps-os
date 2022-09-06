## Plan
1. Terminal -> Storage Transfer
2. Terminal -> Terminal Transfer
3. Use generic haulResourceFromSourceToSink wherever possible
4. Terminal "sell to market if over threshold" logic
5. Make RoomHauler handle link filling, terminal filling, tower filling
6. Keep track of profit made by room and allow it to spend some percentage of that on energy imports
7. Command to transfer room from one colony to another
8. Ability to force spawns to use a minimum amount of energy
    - Also bodyType min isn't respected
9. Actually frickin define creep abilities in the abilities dir & use them.  The "advanced do this thing" pattern is neat
10. Make CreepSpawner less verbose & cleaner to define
- Need to have a common method for naming creeps 
9. Display information about attacks with mapvisuals
10. Allow more base designs
11. Use the cartographer library
12. Create common library for creeps to talk with
13. Get rid of link flags
14. Error handling - catch error and throw it at the end of processing
15. Get rid of primary/secondary room distinction - just have an array of rooms that are claimed in the colony
16. Make generic state machine process that Colony, RoomManager, CreepProcess, and MultiCreepProcess inherit from
17. This.creep.memory comes from process.memory.creepmemory or some shit.  That means it's doubled up unnecessarily.  Potentially stop referencing creep memory

### ColonyManager Refactor Plan
- Separate colony-leve logic and room-level logic into different functions
- Instead of having the weirdness around secondary vs primary room, just have a "update room" function that takes care of creating the pre-stor-bootstrap stuff.  Stop making secondary so unique.  We eventually want this to be way more generic so we could theoretically have more than just the secondary room in there

### Important New Features
- Expansion
- Colonies need to check if a room is already used by another colony before adding it to the colonyRoomInfo
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
