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

        this.generateRoomsFromRoadmap();
        
        if(this.colony.memory['roadRegenerateTick'] === undefined || Game.time - this.colony.memory['roadRegenerateTick'] > TICKS_BETWEEN_FULL_ROAD_RECALCULATION) {
            this.regenerateRoads();
            this.colony.memory['roadRegenerateTick'] = Game.time;
        }
        // - Need to generate roads from roadmap
        //     - Just check every N ticks for each room to see if all of its roads are placed
        //         - Store the last tick it was check at in roomInfo
        //     - If not, place them
    }

    generateRoomsFromRoadmap() {
        for(var roomName in this.colony.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            var roomInfo = this.colony.colonyRoomInfo[roomName];
            if(room === undefined) continue;

            if(roomInfo['roadGenerationTick'] === undefined || Game.time > roomInfo['roadGenerationTick'] + TICKS_BETWEEN_ROAD_CONSTRUCTION_SITE_UPDATES) {
                roomInfo['roadGenerationTick'] = Game.time;

                room.removeAllConstructionSites(STRUCTURE_ROAD);
    
                this.createRoadsForRoom(room);
            }
        }
    }

    createRoadsForRoom(room) {
        var roadmap = this.colony.roadmap;

        for(var x = 0; x <= 49; x++) {
            for(var y = 0; y <= 49; y++) {
               var pos = new RoomPosition(x, y, room.name);
               
               if(roadmap.getPos(pos) === 'road') {
                   pos.createConstructionSite(STRUCTURE_ROAD);
               }
            }
        }
    }

    regenerateRoads() {
        this.colony.roadmap.initAllMaps();
        this.generateHeartHighway();
        this.generateControllerRoad(this.colony.primaryRoom);
        this.generateControllerRoad(this.colony.secondaryRoom);

        if(Game.scheduler.getProcess(this.colony.name + '|energyHarvestingManager') !== undefined) {
            this.generateMiningRouteRoads();
        }
    }

    generateHeartHighway() {
        if(this.colony.primaryRoom === undefined || this.colony.secondaryRoom === undefined) return;
        if(this.colony.primaryRoom.storage === undefined || this.colony.secondaryRoom.storage === undefined) return;
        var storageOne = this.colony.primaryRoom.storage;
        var storageTwo = this.colony.secondaryRoom.storage;

        this.colony.roadmap.makeRoad(storageOne.pos, storageTwo.pos);
    }

    generateControllerRoad(room) {
        if(room === undefined || room.storage === undefined) return;

        this.colony.roadmap.makeRoad(room.storage.pos, room.controller.pos);
    }

    generateMiningRouteRoads() {
        //Get mining processes for this colony, create routes from the containerPos to the storage
        var miningProcesses = this.colony.miningProcesses;

        for(var i = 0; i < miningProcesses.length; i++) {
            var process = miningProcesses[i];
            var storage = Game.getObjectById(process.memory.targetStorageId);
            
            if(storage === null || process.memory.containerPos === undefined) {
                continue;
            }

            var containerPos = new RoomPosition(process.memory.containerPos['x'], process.memory.containerPos['y'], process.memory.containerPos['roomName']);

            this.colony.roadmap.makeRoad(storage.pos, containerPos);
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = RoadGenerator;