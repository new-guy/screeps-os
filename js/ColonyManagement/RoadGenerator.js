const Process = require('Process');

class RoadGenerator extends Process {
    constructor (...args) {
        super(...args);
        
        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
        
        if(this.colony.memory['roadRegenerateTick'] == null || Game.time - this.colony.memory['roadRegenerateTick'] > TICKS_BETWEEN_FULL_ROAD_RECALCULATION) {
            this.regenerateRoads();
            this.colony.memory['roadRegenerateTick'] = Game.time;

        }
    }

    regenerateRoads() {
        this.colony.roadmap.initAllMaps();
        this.generateHeartHighway();
        this.generateControllerRoad(this.colony.primaryRoom);
        this.generateControllerRoad(this.colony.secondaryRoom);

        if(Game.scheduler.getProcess(this.colony.name + '|energyHarvestingManager') != null) {
            this.generateMiningRouteRoads();
        }
    }

    generateHeartHighway() {
        if(this.colony.primaryRoom == null || this.colony.secondaryRoom == null) return;
        if(this.colony.primaryRoom.harvestDestination == null || this.colony.secondaryRoom.harvestDestination == null) return;
        var storageOne = this.colony.primaryRoom.harvestDestination;
        var storageTwo = this.colony.secondaryRoom.harvestDestination;

        this.colony.roadmap.makeRoad(storageOne.pos, storageTwo.pos);
    }

    generateControllerRoad(room) {
        if(room == null || room.harvestDestination == null) return;

        this.colony.roadmap.makeRoad(room.harvestDestination.pos, room.controller.pos);
    }

    generateMiningRouteRoads() {
        //Get mining processes for this colony, create routes from the containerPos to the storage
        var miningProcesses = this.colony.miningProcesses;

        for(var i = 0; i < miningProcesses.length; i++) {
            var process = miningProcesses[i];
            // console.log(process.pid)
            var harvestDestination = Game.rooms[process.memory.targetStorageRoom].harvestDestination;
            
            if(harvestDestination == null || harvestDestination == null || process.memory.containerPos == null) {
                continue;
            }

            var containerPos = new RoomPosition(process.memory.containerPos['x'], process.memory.containerPos['y'], process.memory.containerPos['roomName']);

            this.colony.roadmap.makeRoad(harvestDestination.pos, containerPos, 'mining');
        }

        if(this.colony.primaryRoom != null && this.colony.primaryRoom.controller.level >= 6) {
            var mineral = this.colony.primaryRoom.find(FIND_MINERALS)[0];
            var harvestDestination = this.colony.primaryRoom.harvestDestination;
            
            this.colony.roadmap.makeRoad(harvestDestination.pos, mineral.pos, 'mining');
        }

        if(this.colony.secondaryRoom != null && this.colony.secondaryRoom.controller.level >= 6) {
            var mineral = this.colony.secondaryRoom.find(FIND_MINERALS)[0];
            var harvestDestination = this.colony.secondaryRoom.harvestDestination;
            
            this.colony.roadmap.makeRoad(harvestDestination.pos, mineral.pos, 'mining');
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = RoadGenerator;