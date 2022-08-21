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
        var path = this.findRoadPath(startPos, endPos, type);

        for(var i = 0; i < path.length; i++) {
            this.roadmap.setRoad(path[i])
        }
    }

    findRoadPath(startPos, endPos, type=null)
    {
        var roadmap = this.roadmap;

        return PathFinder.search(startPos, {pos: endPos, range: 1}, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 4,
            swampCost: 8,
            maxOps: 5000,
            
            roomCallback: function(roomName) {
                let room = Game.rooms[roomName];
                // In this example `room` will always exist, but since PathFinder 
                // supports searches which span multiple rooms you should be careful!
                if (!room)
                {
                    console.log("Can't find room " + roomName + " to generate road path");
                    return;
                }
    
                let costs = new PathFinder.CostMatrix;
    
                for(var x = 0; x < 50; x++) {
                    for(var y = 0; y < 50; y++) {
                        var posToEvaluate = new RoomPosition(x, y, roomName);
                        // console.log(x + ', ' + y + ' | ' + roomName);

                        var structAtPos = Memory.rooms[roomName] == null ? 'none' : Memory.rooms[roomName]['roadBuildPlan'][x][y];
                        var roadAtPos = (structAtPos === 'road');

                        if(posToEvaluate.unwalkableStructureExists()) {
                            costs.set(x, y, 0xff);
                        }

                        else if(roadAtPos || posToEvaluate.structureExists(STRUCTURE_ROAD)) {
                            costs.set(x, y, 2);
                        }

                        if(type === 'mining') {
                            var hasAdjacentController = posToEvaluate.getAdjacentStructures(STRUCTURE_CONTROLLER).length > 0;
                            var hasAdjacentExtension = posToEvaluate.getAdjacentStructures(STRUCTURE_EXTENSION).length > 0;

                            if((hasAdjacentController || hasAdjacentExtension) && !roadAtPos) {
                                costs.set(x, y, 10);
                            }
                        }
                    }
                }
    
                return costs;
            }
        }).path;
    }
}

module.exports = RoadmapMakeRoad;