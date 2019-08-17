const Process = require('Process');

var MAX_TICKS_TO_USE_PER_SPAWN = 600;
var TARGET_ROUTES_PER_STORAGE = 6;

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
            if(sourceToHarvest === null) {
                console.log('Could not find new source to mine');
            }
            
            else {
                console.log(sourceToHarvest.pos.roomName + ' ' + sourceToHarvest.pos.x + 'x ' + sourceToHarvest.pos.y + 'y');
                this.createNewRoute(sourceToHarvest);
            }
        }

        else {
            console.log('Cannot create new mining route');
        }

        //We need to be able to calculate mining route information
            //For each Colony.safeSource, calculate the distance to all available storages.  Select the one that's closest
            //Use this to select our first mining route
            //Mining route ensures that the miner and harvester are spawned, along with designating where the container should be
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
        if(this.memory.children === undefined) return true;

        var totalTicksUsed = 0;
        for(var i = 0; i < this.memory.children.length; i++) {
            var childProcess = this.scheduler.getProcess(this.memory.children[i]);
            var ticksUsed = childProcess.getUsedTicks();
            totalTicksUsed += ticksUsed

            console.log(childProcess.pid + ': ' + ticksUsed);
        }

        var totalRoutes = this.memory.children.length;
        var targetRoutes = this.colony.primaryRoom.storage === undefined ? 0 : TARGET_ROUTES_PER_STORAGE;
        targetRoutes += this.colony.secondaryRoom.storage === undefined ? 0 : TARGET_ROUTES_PER_STORAGE;

        var totalMaxTicks = this.colony.spawns.length * MAX_TICKS_TO_USE_PER_SPAWN;

        console.log('Routes: ' + totalRoutes + ' Target: ' + targetRoutes);
        console.log('Ticks: ' + totalTicksUsed + ' Max: ' + totalMaxTicks);

        return (totalRoutes < targetRoutes && totalTicksUsed < totalMaxTicks);
    }

    findSourceToHarvest() {
        var closestSource = null;
        var closestDistance = 10000000000;

        for(var i = 0; i < this.colony.safeSources.length; i++) {
            var source = this.colony.safeSources[i];

            if(this.routeExistsForSource(source)) {
                console.log('Skipping ' + source.pos.readableString());
                continue;
            }

            var closestStorage = this.colony.getClosestStorage(source.pos);
            var distanceToStorage = closestStorage.pos.findPathTo(source, {ignoreCreeps:true}).length;

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

        this.ensureChildProcess(this.getPidForSource(source), 'EnergyRouteManager', data, priority);
    }

    routeExistsForSource(source) {
        var sourcePid = this.getPidForSource(source);
        console.log('Pid: ' + sourcePid);
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