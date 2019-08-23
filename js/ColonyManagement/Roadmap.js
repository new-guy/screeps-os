class Roadmap {
    //Take in a colony name and set our data to be equal to Memory.colonies[colonyName].roadmap[DATA]

    constructor(colony) {
        this.colony = colony;

        if(this.colony.memory.roadmap === undefined) {
            this.colony.memory.roadmap = {};
        }

        this.memory = this.colony.memory.roadmap;

        if(this.memory.shouldDraw === undefined) {
            this.memory.shouldDraw = false;
        }

        if(this.memory.shouldDraw === true) {
            this.drawMaps();
        }
    }

    enableDrawing() {
        this.memory.shouldDraw = true;
    }

    disableDrawing() {
        this.memory.shouldDraw = false;
    }

    drawMaps() {
        for(var roomName in this.colony.colonyRoomInfo) {
            var roadmap = this.getMap(roomName);


            if(roadmap === undefined) continue;

            var visual = new RoomVisual(roomName);

            for(var x = 0; x < roadmap.length; x++) {
                for(var y = 0; y < roadmap[x].length; y++) {
                    var tile = roadmap[x][y];

                    if(tile === 'road') {
                        visual.circle(x, y);
                    }
                }
            }
        }
    }

    initMap(roomName) {
        var roadmap = new Array(50);
    
        for(var i = 0; i < roadmap.length; i++)  {
            roadmap[i] = new Array(50).fill('none');
        }

        this.colony.colonyRoomInfo[roomName]['roadmap'] = roadmap;
    }

    initAllMaps() {
        for(var roomName in this.colony.colonyRoomInfo) {
            this.initMap(roomName);
        }
    }

    getMap(roomName) {
        return this.colony.colonyRoomInfo[roomName]['roadmap'];
    }

    setRoad(roomPosition) {
        var roadmap = this.getMap(roomPosition.roomName);
        if(roadmap === undefined) {
            this.initMap(roomPosition.roomName);
            roadmap = this.getMap(roomPosition.roomName);
        }

        roadmap[roomPosition.x][roomPosition.y] = 'road';
    }

    getPos(roomPosition) {
        var roadmap = this.getMap(roomPosition.roomName);
        if(roadmap === undefined) {
            this.initMap(roomPosition.roomName);
            roadmap = this.getMap(roomPosition.roomName);
        }

        return roadmap[roomPosition.x][roomPosition.y];
    }

    isRoad(roomPosition) {
        return this.getPos(roomPosition) === 'road';
    }

    makeRoad(startPos, endPos) {
        var path = this.findRoadPath(startPos, endPos);

        for(var i = 0; i < path.length; i++) {
            this.setRoad(path[i])
        }
    }

    findRoadPath(startPos, endPos)
    {
        var roadmap = this;

        return PathFinder.search(startPos, {pos: endPos, range: 1}, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 4,
            swampCost: 6,
            
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
    
    
                        var structuresAtPos = posToEvaluate.lookFor(LOOK_STRUCTURES);
                        if(unwalkableStructuresExist(structuresAtPos)) {
                            costs.set(x, y, 0xff);
                        }

                        if(roadmap.getPos(posToEvaluate) === 'road') {
                            costs.set(x, y, 1);
                        }

                        if(posToEvaluate.structureExists(STRUCTURE_ROAD)) {
                            costs.set(x, y, 1);
                        }
                    }
                }
    
                function unwalkableStructuresExist(structures) {
                    for(var i = 0; i < structures.length; i++) {
                        var structure = structures[i];
    
                        if( structure.structureType !== STRUCTURE_RAMPART && 
                            structure.structureType !== STRUCTURE_ROAD && 
                            structure.structureType !== STRUCTURE_CONTAINER) {
                               //structure is unwalkable
                            
                            return true;
                        }
                    }
    
                    return false;
                }
    
                return costs;
            }
        }).path;
    }
    //For computation, we could have the colony call a function in here that just ensures a childprocess that has sleeps
}

module.exports = Roadmap;