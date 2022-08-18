## Plan
1. Spend an hour just fucking cleaning this shitty logic up
    - Booleans, poorly named variables, etc.  Just fucking delete some code, because there's so much BS in here
2. Work on room/colony state refactor
    - This codebase fucking sucks to work on because this early game logic is so tightly coupled
    - It's all just so needlessly complex.  It's a combo of good ideas and shitty hacks.
    - These booleans are INSANE.  ColonyManager is INSANE
    - Figure out some sane way to progress a room/colony through different states
    - Right now it's just such a fucking mess.  Need to use actual states and transition functions in colonies and rooms and whatnot, because this conditional bullshit is just atrocious
3. Invader Defense
4. Expansion
5. Make CreepSpawner less verbose & cleaner to define
6. Create common library for creeps to talk with
7. Need ability to flush processes & creeps
8. Dynamically calculate number of haulers

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