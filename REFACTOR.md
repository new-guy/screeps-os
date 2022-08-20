## Plan
1. Attacking poorly defended bases
2. Break bobsled into MultiCreep
3. Minimum energy in storage needs to be scheduled
3. Manual route planning & drawing on map
    - Either commands or flags - document these
4. Need to be able to send energy to other base once we hit a threshold
5. Ability to force spawns to use a minimum amount of energy
3. Make CreepSpawner less verbose & cleaner to define
4. Need ability to flush processes & creeps
5. Dynamically calculate number of haulers
6. Allow more base designs
7. Make creeps move along road and ignore each other
7. Create common library for creeps to talk with
9. Get rid of link flags
10. Error handling - catch error and throw it at the end of processing
11. Get rid of primary/secondary room distinction - just have an array of rooms that are claimed in the colony
12. Make generic state machine process that Colony, RoomManager, CreepProcess, and MultiCreepProcess inherit from

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
- Either use Null or undefined - stop mixing
- Make HomeRoomConstructionTools more DRY
- Generic "move to target" function & state?  Would be good to not have to keep rewriting it
- Do we differentiate between secondary and primary too much? Should we instead just be treating them the same in the code more?
    - Probably should minimize the differentiation in general to help simplify things
        - We reference the word "secondary" 178 times :|
    - We get so much fucking complexity from having primary and secondary so thoroughly in the code.  Need to remove that logic wherever we can

### Fixes
- Document how the friggin OS actually works