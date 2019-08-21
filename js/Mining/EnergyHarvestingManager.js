const Process = require('Process');

var MAX_TICKS_TO_USE_PER_SPAWN = 700;
var TARGET_ROUTES_PER_STORAGE = 5;

var TIME_BETWEEN_PURGES = 1500;

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
            this.drawMiningRoutes();
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

    drawMiningRoutes() {
        var rootPosition = {
            x: 42,
            y: 3
        };

        var visualStyle = {
            align: 'left',
            color: '#cccc00'
        };

        var visual = new RoomVisual(this.colony.primaryRoom.name);

        var totalTicksUsed = 0;
        for(var i = 0; i < this.memory.children.length; i++) {
            var childProcess = this.scheduler.getProcess(this.memory.children[i]);
            var isOperational = childProcess.isOperational();
            var ticksUsed = childProcess.getUsedTicks();
            totalTicksUsed += ticksUsed

            visual.text(childProcess.pid.split("|")[0], rootPosition['x'], rootPosition['y'] + 2 + i, visualStyle);

            var fillColor = isOperational ? "#00ff00" : "#ff0000";
            visual.circle(rootPosition['x'] - 0.5, rootPosition['y'] + 1.8 + i, {fill: fillColor});
        }

        var totalRoutes = this.memory.children.length;
        var targetRoutes = this.colony.primaryRoom.storage === undefined ? 0 : TARGET_ROUTES_PER_STORAGE;
        targetRoutes += this.colony.secondaryRoom.storage === undefined ? 0 : TARGET_ROUTES_PER_STORAGE;

        var totalMaxTicks = this.colony.spawns.length * MAX_TICKS_TO_USE_PER_SPAWN;

        visual.text('Routes: ' + totalRoutes + ' | Target: ' + targetRoutes, rootPosition['x'], rootPosition['y'], visualStyle);
        visual.text('Ticks: ' + totalTicksUsed + ' | Max: ' + totalMaxTicks, rootPosition['x'], rootPosition['y'] + 1, visualStyle);
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
        var closestStorage = this.colony.getClosestStorage(sourcePos);
        // - Miners should just go to their assigned source, make sure a container is built, and mine
        // - Haulers should pick up from their assigned source, then deposit in the closest storage (this value should be cached)
        var data = {
            'targetSourcePos': {
                'x': sourcePos.x,
                'y': sourcePos.y,
                'roomName': sourcePos.roomName
            },
            'targetStorageId': closestStorage.id,
            'spawnColonyName': this.colony.name
        };

        //If the source is in the same room as a storage, set it to necessary energy
        //If not, set it to extra energy

        var priority = COLONY_EXTRA_ENERGY_PRIORITY;

        if(sourcePos.roomName === closestStorage.pos.roomName) {
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
