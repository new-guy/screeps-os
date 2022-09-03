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

    findRoadPath(startPos, endPos, type=null)
    {
        var roadmap = this;

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

                        var roadAtPos = roadmap.isRoad(posToEvaluate);
                        
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

module.exports = Roadmap;