- The way we define process names is really gross.  It's constants duplicated all over the place - that should instead be defined in the actual process definition itself
- Define an expected baseline of how long it takes to get both rooms to level 4 as a basic metric for evaluating if changes are good, and ideally some automated test


## Tidy Up
- Just do a pass of boolean logic and clean up the undefined BS
- Move behavior config constants into constants.js

## Plan

### Records
Ticks remaining in Safe mode
- RCL3 
    - Baseline: 8500
    - Pass 1: 10500
- RCL4
    - Pass 1:


### Speedup plans

### Functionality to change
- Small balancer is such a waste
- New Defense Code
    - Both creating defenses and killing enemies
- Scouting needs to detect when destinations are dangerous and set a value in the room's memory that can then be checked by other processes
- Do we differentiate between secondary and primary too much? Should we instead just be treating them the same in the code more?
    - Probably should minimize the differentiation in general to help simplify things
        - We reference the word "secondaary" 154 times :|
    - We get so much fucking complexity from having primary and secondary so thoroughly in the code.  Need to remove that logic wherever we can

### Refactors
- Make construction use memory objects instead of flags, and be able to draw it on the friggin map
    - Make road generation use the same logic that construction does
- Either use Null or undefined - stop mixing
- Make HomeRoomConstructionTools more DRY
- Consolidate room/creep/colony/game tools/prototype modifications into files to make them more sensible
- Get rid of targetRoom for bootstrapper
- Booleans should be words instead of lots of &&s and ||s
- Move constants to constants.js
- CreepSpawners are way too verbose to define
- Get rid of construction flags and just use a list + drawing on the screen
- Generic "move to target" function & state?  Would be good to not have to keep rewriting it
- Inits in main.js can be better - should instead be in object-specific files
- Should roadmaps and building maps be different?  Or should the roadmap just be the road parts of the building map?

### Fixes
- Document how the friggin OS actually works