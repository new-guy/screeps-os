const SingleTickProcess = require('SingleTickProcess');

class RoadmapMakeRoad extends SingleTickProcess {
    constructor (...args) {
        super(...args);
        
        this.colony = Game.colonies[this.memory.colonyName];
        this.roadmap = Game.colonies[this.memory.colonyName].roadmap;

        this.startPos = new RoomPosition(this.memory.startPos.x, this.memory.startPos.y, this.memory.startPos.roomName);
        this.endPos = new RoomPosition(this.memory.endPos.x, this.memory.endPos.y, this.memory.endPos.roomName);
        this.type = this.memory.type;
    }

    update() {
        if(this.roadmap == null) return 'exit';

        this.makeRoad(this.startPos, this.endPos, this.type);
    }

    makeRoad(startPos, endPos, type=null) {
        var path = this.roadmap.findRoadPath(startPos, endPos, type);

        for(var i = 0; i < path.length; i++) {
            this.roadmap.setRoad(path[i])
        }
    }
}

module.exports = RoadmapMakeRoad;