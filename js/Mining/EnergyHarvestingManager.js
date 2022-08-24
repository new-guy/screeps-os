const Process = require('Process');

class EnergyHarvestingManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];

        if(this.memory.timeSinceLastPurged == null) {
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
        if(this.memory.children != null) {
            this.ensureMiningRoutes();
            this.printMiningRoutes();
        }

        if(!this.allMiningRoutesAreOperational()) {
            console.log('Waiting for mining routes to become operational')
            return 'continue'
        }

        //Ensure the interior mining routes for rooms with storage

        //

        if(this.canCreateNewMiningRoute()) {
            var sourcePos = this.findSourcePosToHarvest();
            if(sourcePos != null) {
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

        if(this.memory.children == null) {
            return areOperational;
        }

        for(var i = 0; i < this.memory.children.length; i++) {
            var childProcess = this.scheduler.getProcess(this.memory.children[i]);

            if(!childProcess.isOperational()) {
                areOperational = false;
                break;
            }
        }

        return areOperational;
    }

    printMiningRoutes() {
        this.printRoutesInRoom(this.colony.primaryRoom);
        if(this.colony.secondaryRoom != null) this.printRoutesInRoom(this.colony.secondaryRoom);
        this.printMapInfo();
    }

    printRoutesInRoom(room) {
        var rootPosition = {
            x: 42,
            y: 3
        };

        var visualStyle = {
            align: 'left',
            color: '#cccc00'
        };

        var visual = new RoomVisual(room.name);

        var totalTicksUsed = 0;
        for(var i = 0; i < this.memory.children.length; i++) {
            var childProcess = this.scheduler.getProcess(this.memory.children[i]);
            var isOperational = childProcess.isOperational();
            var ticksUsed = childProcess.getUsedTicks();
            totalTicksUsed += ticksUsed

            visual.text(childProcess.pid.split("|")[0], rootPosition['x'], rootPosition['y'] + 2 + i, visualStyle);

            var fillColor = isOperational ? "#00ff00" : "#aa1111";
            visual.circle(rootPosition['x'] - 0.5, rootPosition['y'] + 1.8 + i, {fill: fillColor});

            var roomIsStorageTarget = childProcess.targetStorageRoom.name === room.name;
            if(roomIsStorageTarget)
                visual.circle(rootPosition['x'] - 1.5, rootPosition['y'] + 1.8 + i, {fill: "#9999ff"});
        }

        var totalRoutes = this.memory.children.length;
        var targetRoutes = this.colony.primaryRoom.harvestDestination == null ? 0 : TARGET_ROUTES_PER_STORAGE;

        if (this.colony.secondaryRoom != null)
            targetRoutes += this.colony.secondaryRoom.harvestDestination == null ? 0 : TARGET_ROUTES_PER_STORAGE;

        var totalMaxTicks = this.colony.spawns.length * MAX_TICKS_TO_USE_PER_SPAWN;

        visual.text('Routes: ' + totalRoutes + ' | Target: ' + targetRoutes, rootPosition['x'], rootPosition['y'], visualStyle);
        visual.text('Ticks: ' + totalTicksUsed + ' | Max: ' + totalMaxTicks, rootPosition['x'], rootPosition['y'] + 1, visualStyle);
    }

    printMapInfo() {
        for(var i = 0; i < this.memory.children.length; i++) {
            var childProcess = this.scheduler.getProcess(this.memory.children[i]);
            var isOperational = childProcess.isOperational();

            var fillColor = isOperational ? "#00ff00" : "#aa1111";
            Game.map.visual.circle(childProcess.targetSourcePos, {fill: fillColor, radius: 2, opacity: 0.7});
            if(childProcess.targetStorageRoom != null && childProcess.targetStorageRoom.harvestDestination != null) {
                var harvestDestPos = childProcess.targetStorageRoom.harvestDestination.pos;

                var lineStyle = isOperational ? undefined : "dashed";
                Game.map.visual.line(childProcess.targetSourcePos, harvestDestPos, {color: '#eeee22', opacity: 0.8, lineStyle: lineStyle});
            }
        }
    }

    canCreateNewMiningRoute() {
        if(this.memory.children == null) return true;

        var totalTicksUsed = 0;
        for(var i = 0; i < this.memory.children.length; i++) {
            var childProcess = this.scheduler.getProcess(this.memory.children[i]);
            var ticksUsed = childProcess.getUsedTicks();
            totalTicksUsed += ticksUsed
        }

        var totalRoutes = this.memory.children.length;
        var targetRoutes = this.colony.primaryRoom.harvestDestination == null ? 0 : TARGET_ROUTES_PER_STORAGE;

        if (this.colony.secondaryRoom != null)
            targetRoutes += this.colony.secondaryRoom.harvestDestination == null ? 0 : TARGET_ROUTES_PER_STORAGE;

        var totalMaxTicks = this.colony.spawns.length * MAX_TICKS_TO_USE_PER_SPAWN;

        return (totalRoutes < targetRoutes && totalTicksUsed < totalMaxTicks);
    }

    findSourcePosToHarvest() {
        var closestSourcePos = null;

        var sourceInfoByDistance = this.colony.getSafeSourceInfoByMineableDistance();

        for(var i = 0; i < sourceInfoByDistance.length; i++) {
            var sourceInfo = sourceInfoByDistance[i];
            var sourcePos = new RoomPosition(sourceInfo['pos']['x'], sourceInfo['pos']['y'], sourceInfo['pos']['roomName']);

            var routeExists = this.routeExistsForSourcePos(sourcePos);

            var room = Game.rooms[sourcePos.roomName];
            var hasInvaders = room != null && (room.hasInvaders() || room.hasInvaderStructures());

            if(routeExists || hasInvaders) {
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
        var storageRoomName = closestHarvestDestination.pos.roomName
        if(sourcePos.roomName === this.colony.memory.primaryRoomName || sourcePos.roomName === this.colony.memory.secondaryRoomName) {
            storageRoomName = sourcePos.roomName;
        }

        var data = {
            'targetSourcePos': {
                'x': sourcePos.x,
                'y': sourcePos.y,
                'roomName': sourcePos.roomName
            },
            'targetStorageRoom': storageRoomName,
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
        return Memory.processes[sourcePid] != null;
    }

    getPidForSourcePos(sourcePos) {
        return sourcePos.readableString() + '|energyRoute';
    }

    processShouldDie() {
        return false;
    }
}

module.exports = EnergyHarvestingManager;
