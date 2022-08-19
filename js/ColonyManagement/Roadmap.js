class Roadmap {
    //Take in a colony name and set our data to be equal to Memory.colonies[colonyName].roadmap[DATA]

    constructor(colony) {
        this.colony = colony;

        if(this.colony.memory.roadmap == null) {
            this.colony.memory.roadmap = {};
        }

        this.memory = this.colony.memory.roadmap;

        if(this.memory.shouldDraw == null) {
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


            if(roadmap == null) continue;

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
        if(roadmap == null) {
            this.initMap(roomPosition.roomName);
            roadmap = this.getMap(roomPosition.roomName);
        }

        roadmap[roomPosition.x][roomPosition.y] = 'road';
    }

    getPos(roomPosition) {
        var roadmap = this.getMap(roomPosition.roomName);
        if(roadmap == null) {
            this.initMap(roomPosition.roomName);
            roadmap = this.getMap(roomPosition.roomName);
        }

        return roadmap[roomPosition.x][roomPosition.y];
    }

    isRoad(roomPosition) {
        return this.getPos(roomPosition) === 'road';
    }

    makeRoad(startPos, endPos, type=undefined) {
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