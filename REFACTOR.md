- The way we define process names is really gross.  It's constants duplicated all over the place - that should instead be defined in the actual process definition itself
- Define an expected baseline of how long it takes to get both rooms to level 4 as a basic metric for evaluating if changes are good, and ideally some automated test


## Tidy Up
- Just do a pass of boolean logic and clean up the undefined BS
- Move behavior config constants into constants.js

## Plan
### Goals
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