class Roadmap {
    //Take in a colony name and set our data to be equal to Memory.colonies[colonyName].roadmap[DATA]

    constructor(colony) {
        this.colony = colony;

        if(this.colony.memory.roadmap == null) {
            this.colony.memory.roadmap = {};
        }
    }

    initMap(roomName) {
        var roadmap = new Array(50);
    
        for(var i = 0; i < roadmap.length; i++)  {
            roadmap[i] = new Array(50).fill(null);
        }
        var roomMemory = Memory.rooms[roomName];

        roomMemory['roadmap'] = roadmap;
    }

    initAllMaps() {
        for(var roomName in this.colony.colonyRoomInfo) {
            this.initMap(roomName);
        }
    }

    getMap(roomName) {
        var roomMemory = Memory.rooms[roomName];
        var roadmap = roomMemory['roadmap'];
        return roadmap;
    }

    setRoad(roomPosition) {
        var roadmap = this.getMap(roomPosition.roomName);
        if(roadmap == null) {
            this.initMap(roomPosition.roomName);
            roadmap = this.getMap(roomPosition.roomName);
        }

        if(roadmap == null) return;

        roadmap[roomPosition.x][roomPosition.y] = 'road';
    }

    getPos(roomPosition) {
        var roadmap = this.getMap(roomPosition.roomName);
        if(roadmap == null) {
            this.initMap(roomPosition.roomName);
            roadmap = this.getMap(roomPosition.roomName);
        }

        if(roadmap == null) return null;

        return roadmap[roomPosition.x][roomPosition.y];
    }

    isRoad(roomPosition) {
        return this.getPos(roomPosition) === 'road';
    }

    makeRoad(startPos, endPos, type=null) {
        var data = {
            'startPos': {'x': startPos.x, 'y': startPos.y, 'roomName': startPos.roomName},
            'endPos': {'x': endPos.x, 'y': endPos.y, 'roomName': endPos.roomName},
            'type': type,
            'colonyName': this.colony.name
        };

        var makeRoadPid ='makeRoad|' + startPos.x + startPos.y + startPos.roomName + endPos.x + endPos.y + endPos.roomName;
        Game.scheduler.addProcessThisTick(makeRoadPid, 'RoadmapMakeRoad', data, COLONY_NONESSENTIAL_PRIORITY);
    }
}

module.exports = Roadmap;