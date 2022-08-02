const Process = require('Process');

var DEFAULT_SCOUT_INTERVAL = 4000;
var DISTANCE_SCOUT_INTERVAL = {
    "1": 50,
    "2": 2000,
    "3": DEFAULT_SCOUT_INTERVAL
};

var ROOM_INFO_UPDATE_INTERVAL = 1000;

class ColonyScoutingManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        var roomsByDistance = this.colony.roomsByDistance;

        for(var distance in roomsByDistance) {
            var scoutInterval = DISTANCE_SCOUT_INTERVAL[distance];

            if(scoutInterval === undefined) scoutInterval = DEFAULT_SCOUT_INTERVAL;

            for(var i in roomsByDistance[distance]) {
                var roomName = roomsByDistance[distance][i].roomName;

                var room = Game.rooms[roomName];

                if(room !== undefined) {
                    this.updateScoutingInfo(room);
                }

                else {
                    var data = {
                        'colonyName': this.colony.name,
                        'creepCount': 1,
                        'creepNameBase': 'colScout|' + this.colony.name + '|' + roomName,
                        'creepBodyType': 'Scout',
                        'creepProcessClass': 'Scout',
                        'creepMemory': {
                            'targetRoom': roomName
                        }
                    };
                    
                    var spawnPID = 'colScout|' + this.colony.name + '|' + roomName;

                    var spawnPriority = COLONY_SCOUTING_PRIORITY;

                    if(distance === 1) spawnPriority = COLONY_ADJACENT_SCOUT_PRIORITY;

                    if(Memory.scouting.rooms[roomName] === undefined)  {
                        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, spawnPriority);
                    }

                    else if(Game.time - Memory.scouting.rooms[roomName].lastColonyScout > scoutInterval) {
                        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, spawnPriority);
                    }
                }
            }
        }
    }

    updateScoutingInfo(room) {
        if(Memory.scouting.rooms[room.name] === undefined) {
            Memory.scouting.rooms[room.name] = {};
        }

        var scoutingInfo = Memory.scouting.rooms[room.name];
            
        if(scoutingInfo.sourceInfo === undefined || scoutingInfo.lastFullColonyScout === undefined || Game.time - scoutingInfo.lastFullColonyScout > ROOM_INFO_UPDATE_INTERVAL) {
            var fullSourceInfo = {};
            var primaryHeartPos = this.colony.primaryRoom.find(FIND_FLAGS, {filter: function(f) { return f.name.startsWith('!CHUNK|heart') }})[0].pos;
    
            if(primaryHeartPos !== undefined) {
                var sourcesInRoom = room.find(FIND_SOURCES);
                for(var i = 0; i < sourcesInRoom.length; i++) {
                    var source = sourcesInRoom[i];
                    var distToPrimary = PathFinder.search(source.pos, primaryHeartPos).path.length;
                    fullSourceInfo[source.id] = {
                        'distanceToPrimaryHeart': distToPrimary,
                        'pos': {
                            'x': source.pos.x,
                            'y': source.pos.y,
                            'roomName': source.pos.roomName
                        } 
                    }

                    if(this.colony.secondaryRoom !== undefined) {
                        var secondaryHeartPos = this.colony.secondaryRoom.find(FIND_FLAGS, {filter: function(f) { return f.name.startsWith('!CHUNK|heart') }})[0].pos;
                        var distToSecondary = PathFinder.search(source.pos, secondaryHeartPos).path.length;
                        fullSourceInfo[source.id]['distanceToSecondaryHeart'] = distToSecondary;
                    }
                }
            }
            scoutingInfo.lastFullColonyScout = Game.time;
            scoutingInfo.sourceInfo = fullSourceInfo;
        }

        if(scoutingInfo.skLairs === undefined) {    
            scoutingInfo.isSkRoom = room.hasSourceKeepers;
        }

        scoutingInfo.lastColonyScout = Game.time;
    }

    processShouldDie() {
        return this.colony === undefined;
    }
}

module.exports = ColonyScoutingManager;