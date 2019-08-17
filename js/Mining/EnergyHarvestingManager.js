const Process = require('Process');

class EnergyHarvestingManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        //CHECK IF MINING ROUTE SHOULD BE ENSURED
            //If we are not in coma, ensure all existing routes
            //If we are in coma, only ensure the interior ones
        if(this.memory.children !== undefined) {
            this.ensureMiningRoutes();
        }

        if(!this.allMiningRoutesAreOperational()) {
            console.log('Waiting for mining routes to become operational')
            return 'continue'
        }

        //Ensure the interior mining routes for rooms with storage

        //

        if(this.canCreateNewMiningRoute()) {
            var sourceToHarvest = this.findSourceToHarvest();
            console.log(sourceToHarvest.pos.roomName + ' ' + sourceToHarvest.pos.x + 'x ' + sourceToHarvest.pos.y + 'y');
            this.createNewRoute(sourceToHarvest);
        }

        else {
            console.log('Cannot create new mining route');
        }

        //We need to be able to calculate mining route information
            //For each Colony.safeSource, calculate the distance to all available storages.  Select the one that's closest
            //Use this to select our first mining route
            //Mining route ensures that the miner and harvester are spawned, along with designating where the container should be

        /*
        - Each mining operation should be its own process
            - Update the "Ensure Child Process" function so that it returns the child process if it exists
            - The mining route process should be able to return information about the mining route, such as if it is in full operation
        - Colonies should have a mining manager process which controls the mining operations
            - Mining routes should be created
                - High priority for the room's own sources
                - Up to a maximum number of ticks per spawner
                    - This should be able to be controlled by a variable so that we can control it based upon state
                    - We need to know how many ticks a mining operation will consume
            - Mining operations should be started one by one.  New mining operations should only be started when the previous has all of its creeps being spawned or in existence
            - To create a route, have the manager check the colony's available sources (meaning not owned by SKs or other players) by order of nearest to either of the colony's storages one by one
                - If there is a route for that source already, continue
                - If there is not a route, create one.
                - If we can't find any available sources, tell the colony that we need to scout
        */
    }

    ensureMiningRoutes() {
        for(var i = 0; i < this.memory.children.length; i++) {
            this.ensureChildByPid(this.memory.children[i]);
        }
    }

    allMiningRoutesAreOperational() {
        var areOperational = true;

        if(this.memory.children === undefined) {
            return areOperational;
        }

        for(var i = 0; i < this.memory.children.length; i++) {
            var childProcess = this.scheduler.getProcess(this.memory.children[i]);

            console.log(this.memory.children[i] + ' operational: ' + childProcess.isOperational());

            if(!childProcess.isOperational()) {
                areOperational = false;
                break;
            }
        }

        return areOperational;
    }

    canCreateNewMiningRoute() {
        return (this.memory.children === undefined || this.memory.children.length < 2);
    }

    findSourceToHarvest() {
        var closestSource = this.colony.safeSources[0];
        var closestDistance = this.colony.getClosestStorage(closestSource.pos).pos.findPathTo(closestSource).length;

        for(var i = 1; i < this.colony.safeSources.length; i++) {
            var source = this.colony.safeSources[i];

            if(this.routeExistsForSource(source)) {
                continue;
            }

            var closestStorage = this.colony.getClosestStorage(source.pos);
            var distanceToStorage = closestStorage.pos.findPathTo(source).length;

            if(distanceToStorage < closestDistance) {
                closestSource = source;
                closestDistance = distanceToStorage;
            }

            source.room.visual.text(distanceToStorage, source.pos.x, source.pos.y-0.3, {font: "#5555ff"});
        }

        return closestSource;
    }

    createNewRoute(source) {
        var closestStorage = this.colony.getClosestStorage(source.pos);
        // - Miners should just go to their assigned source, make sure a container is built, and mine
        // - Haulers should pick up from their assigned source, then deposit in the closest storage (this value should be cached)
        var data = {
            'targetSourceId': source.id,
            'targetStorageId': closestStorage.id,
            'spawnColonyName': this.colony.name
        };

        //If the source is in the same room as a storage, set it to necessary energy
        //If not, set it to extra energy

        var priority = COLONY_EXTRA_ENERGY_PRIORITY;

        if(source.pos.roomName === closestStorage.pos.roomName) {
            priority = COLONY_NECESSARY_ENERGY_PRIORITY;
        }

        this.ensureChildProcess(this.getPidForSource(source) + '|energyRoute', 'EnergyRouteManager', data, priority);
    }

    routeExistsForSource(source) {
        var sourcePid = this.getPidForSource(source);
        return Memory.processes[sourcePid] !== undefined;
    }

    getPidForSource(source) {
        return source.pos.readableString() + '|energyRoute';
    }

    processShouldDie() {
        return false;
    }
}

module.exports = EnergyHarvestingManager;