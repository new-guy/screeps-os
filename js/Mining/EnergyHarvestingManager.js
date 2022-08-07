const Process = require('Process');

class EnergyHarvestingManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];

        if(this.memory.timeSinceLastPurged === undefined) {
            this.memory.timeSinceLastPurged = Game.time;
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.shouldPurge()) {
            this.killAllChildren();
            this.memory.timeSinceLastPurged = Game.time;
            return 'continue';
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
            var sourcePos = this.findSourcePosToHarvest();
            if(sourcePos === null) {
                console.log('Could not find new source to mine');
            }
            
            else {
                console.log(sourcePos.readableString());
                this.createNewRoute(sourcePos);
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

    shouldPurge() {
        return Game.time - this.memory.timeSinceLastPurged > TIME_BETWEEN_PURGES;
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
        var targetRoutes = this.colony.primaryRoom.harvestDestination === undefined ? 0 : TARGET_ROUTES_PER_STORAGE;

        if (this.colony.secondaryRoom !== undefined)
            targetRoutes += this.colony.secondaryRoom.harvestDestination === undefined ? 0 : TARGET_ROUTES_PER_STORAGE;

        var totalMaxTicks = this.colony.spawns.length * MAX_TICKS_TO_USE_PER_SPAWN;

        console.log('Routes: ' + totalRoutes + ' Target: ' + targetRoutes);
        console.log('Ticks: ' + totalTicksUsed + ' Max: ' + totalMaxTicks);

        return (totalRoutes < targetRoutes && totalTicksUsed < totalMaxTicks);
    }

    findSourcePosToHarvest() {
        var closestSourcePos = null;

        var sourceInfoByDistance = this.colony.getSafeSourceInfoByMineableDistance();

        for(var i = 0; i < sourceInfoByDistance.length; i++) {
            var sourceInfo = sourceInfoByDistance[i];
            var sourcePos = new RoomPosition(sourceInfo['pos']['x'], sourceInfo['pos']['y'], sourceInfo['pos']['roomName']);

            if(this.routeExistsForSourcePos(sourcePos)) {
                console.log('Skipping ' + sourcePos.readableString());
                continue;
            }
            
            else {
                closestSourcePos = sourcePos;
                break;
            }
        }

        return closestSourcePos;
    }

    createNewRoute(sourcePos) {
        var closestHarvestDestination = this.colony.getClosestHarvestDestination(sourcePos);
        // - Miners should just go to their assigned source, make sure a container is built, and mine
        // - Haulers should pick up from their assigned source, then deposit in the closest storage (this value should be cached)
        var data = {
            'targetSourcePos': {
                'x': sourcePos.x,
                'y': sourcePos.y,
                'roomName': sourcePos.roomName
            },
            'targetStorageRoom': closestHarvestDestination.pos.roomName,
            'spawnColonyName': this.colony.name
        };

        //If the source is in the same room as a storage, set it to necessary energy
        //If not, set it to extra energy

        var priority = COLONY_EXTRA_ENERGY_PRIORITY;

        if(sourcePos.roomName === closestHarvestDestination.pos.roomName) {
            priority = COLONY_NECESSARY_ENERGY_PRIORITY;
        }

        this.ensureChildProcess(this.getPidForSourcePos(sourcePos), 'EnergyRouteManager', data, priority);
    }

    routeExistsForSourcePos(sourcePos) {
        var sourcePid = this.getPidForSourcePos(sourcePos);
        console.log('Pid: ' + sourcePid);
        return Memory.processes[sourcePid] !== undefined;
    }

    getPidForSourcePos(sourcePos) {
        return sourcePos.readableString() + '|energyRoute';
    }

    processShouldDie() {
        return false;
    }
}

module.exports = EnergyHarvestingManager;
