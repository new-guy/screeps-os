- The way we define process names is really gross.  It's constants duplicated all over the place - that should instead be defined in the actual process definition itself
- Define an expected baseline of how long it takes to get both rooms to level 4 as a basic metric for evaluating if changes are good, and ideally some automated test


## Tidy Up
- Just do a pass of boolean logic and clean up the undefined BS
- Move behavior config constants into constants.js

## Plan

### Necessary to get on public server
- Defense against invaders
- Roads
- Ramparts
- Replace container w/ storage

### Records
Ticks remaining in Safe mode
- RCL3 
    - Baseline: 8500
    - Pass 1: 10500
- RCL4
    - Pass 1:

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
- Either use Null or undefined - stop mixing
- Make HomeRoomConstructionTools more DRY
- Consolidate room/creep/colony/game tools/prototype modifications into files to make them more sensible
- Get rid of targetRoom for bootstrapper
- Booleans should be words instead of lots of &&s and ||s
- Move constants to constants.js
- CreepSpawners are way too verbose to define
- Generic "move to target" function & state?  Would be good to not have to keep rewriting it
- Inits in main.js can be better - should instead be in object-specific files

### Potential issues
- Colony-level road planning has potential for multiple colonies defining the same room and introducing a race condition.  Search for `addRoadsToBuildPlan(room) {`
- The upgrade spawner and upgrade feeder spawner didn't get cleaned up on one occasion.  Child process cleanup failed :()

### Fixes
- Document how the friggin OS actually works