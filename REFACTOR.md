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


### Goals
- Make the logic SIMPLER.  Delete code
- Make the pre-RCL4 logic tighter and faster
    - Get rid of unnecessary processes
    - Tidy up the code
    - Make it more efficient
    - Make the logic controlling room state more reasonable

### Steps
- Iterate:
    - Start from scratch
    - Look at all the processes & read through the code to understand what is actually going on
    - Fix underlying issues causing bugs & refactor
    - Speed up time to RCL3
        - Time baseline for getting to RCL3
        - Make changes & see how it affects things
- Go through this list and actually tidy it up lol

### Speedup plans
- Bootstrapper count should be much higher - remove limits and see what happens
    - If room is RCL1, there are no Game.creeps with the name colScout|W2N5
    - Honestly might not be that big of a deal.  Might be more effort and code complexity than it's worth
- After filling a factory, bootstrappers should look to see if they can find another factory before continuing on

### Functionality to change
- No defenses between the two colonies :|
- Do we differentiate between secondary and primary too much? Should we instead just be treating them the same in the code more?
    - Probably should minimize the differentiation in general to help simplify things
        - We reference the word "secondaary" 154 times :|
    - We get so much fucking complexity from having primary and secondary so thoroughly in the code.  Need to remove that logic wherever we can

### Refactors
- Consolidate room/creep/colony/game tools/prototype modifications into files to make them more sensible
- Booleans should be words instead of lots of &&s and ||s
- Move constants to constants.js
- CreepSpawners are way too verbose to define
- Get rid of construction flags and just use a list + drawing on the screen
- Generic "move to target" function & state?  Would be good to not have to keep rewriting it
- Inits in main.js can be better - should instead be in object-specific files
- Should roadmaps and building maps be different?  Or should the roadmap just be the road parts of the building map?

### Fixes
- Should plan all building placement from the beginning and store it in an array
- Road generation should use the planned storage rather than the actual storage