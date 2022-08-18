## Plan
1. Work on room/colony state refactor
    - This codebase fucking sucks to work on because this early game logic is so tightly coupled
    - It's all just so needlessly complex.  It's a combo of good ideas and shitty hacks.
    - These booleans are INSANE.  ColonyManager is INSANE
2. Invasion defense needs to ignore rooms with invader bases
3. Expansion
    - Manual route planning & drawing on map
        - Either commands or flags - document these
    - Send claimer, expansion bootstrappers, and create new colony once claimed
    - See what breaks :sunglasses:
4. Make CreepSpawner less verbose & cleaner to define
5. Create common library for creeps to talk with
6. Need ability to flush processes & creeps
7. Dynamically calculate number of haulers
8. Break road repair and rampart repair into their own creeps

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