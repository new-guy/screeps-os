const Process = require('Process');

var TICKS_BETWEEN_ROAD_CONSTRUCTION_SITE_UPDATES = 500;

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

    processShouldDie() {
        return false;
    }
}

module.exports = RoadGenerator;