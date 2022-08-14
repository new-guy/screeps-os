## Plan
1. Links for RCL5
2. Spend an hour just fucking cleaning this shitty logic up
    - Booleans, poorly named variables, etc.  Just fucking delete some code, because there's so much BS in here
    - Consolidate where/how we define prototypes and set room/creep attributes.  Stop doing it all over the fucking place
    - Finish moving constants to constants.js
3. Invader Defense
4. Expansion
5. Make CreepSpawner less verbose & cleaner to define

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