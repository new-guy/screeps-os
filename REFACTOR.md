- The way we define process names is really gross.  It's constants duplicated all over the place - that should instead be defined in the actual process definition itself
- Define an expected baseline of how long it takes to get both rooms to level 4 as a basic metric for evaluating if changes are good, and ideally some automated test


## Tidy Up
- Just do a pass of boolean logic and clean up the undefined BS
- Move behavior config constants into constants.js

## Plan
RCL3 Baseline Ticks remaining in Safe mode: 8500


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

### Speedup plans
- Bootstrapper count should be much higher - remove limits and see what happens
    - If room is RCL1, there are no Game.creeps with the name colScout|W2N5
    - Honestly might not be that big of a deal.  Might be more effort and code complexity than it's worth
- After filling a factory, bootstrappers should look to see if they can find another factory before continuing on

### Refactors
- Booleans should be words instead of lots of &&s and ||s
- Move constants to constants.js
- Get rid of construction flags and just use a list + drawing on the screen
- Generic "move to target" function & state?  Would be good to not have to keep rewriting it
- Inits in main.js can be better - should instead be in object-specific files
- Should roadmaps and building maps be different?  Or should the roadmap just be the road parts of the building map?

### Fixes
- Should plan all building placement from the beginning and store it in an array
- Road generation should use the planned storage rather than the actual storage

- creepPriority doesn't seem to be used at all - the thing that controls spawn priority is process priority, which means that the bootstrap spawner always beats out the scout spawner.  We could just remove creepPriority and when a CreepSpawn process gets skipped over, increase its priority in addition to sleeping (up to a threshold)