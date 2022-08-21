## Plan
1. Wall Mining
2. Ability to force spawns to use a minimum amount of energy
    - Also bodyType min isn't respected
3. Actually frickin define creep abilities in the abilities dir & use them.  The "advanced do this thing" pattern is neat
3. Make CreepSpawner less verbose & cleaner to define
4. Minimum energy in storage needs to be scheduled
5. Friggin display more information about the state of the room/creeps with roomVisuals
6. Dynamically calculate number of haulers
7. Make creeps move along road and ignore each other
8. Need to be able to send energy to other base once we hit a threshold
9. Need ability to flush processes & creeps
10. Allow more base designs
11. Create common library for creeps to talk with
12. Get rid of link flags
13. Error handling - catch error and throw it at the end of processing
14. Get rid of primary/secondary room distinction - just have an array of rooms that are claimed in the colony
15. Make generic state machine process that Colony, RoomManager, CreepProcess, and MultiCreepProcess inherit from

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
