const Process = require('Process');

var DEFAULT_SCOUT_INTERVAL = 6000;
var DISTANCE_SCOUT_INTERVAL = {
    "1": 50,
    "2": 3000,
    "3": DEFAULT_SCOUT_INTERVAL
};

class ColonyScoutingManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        console.log('Scouting Manager ' + this.pid + ' Colony: ' + this.memory.colonyName);

        if(super.update() == 'exit') {
            return 'exit';
        }

        var roomsByDistance = this.colony.roomsByDistance;

        for(var distance in roomsByDistance) {
            console.log(distance)
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
                        },
                        'creepPriority': COLONY_SCOUTING_PRIORITY
                    };
                    
                    var spawnPID = 'colScout|' + this.colony.name + '|' + roomName;

                    if(Memory.scouting.rooms[roomName] === undefined)  {
                        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_SCOUTING_PRIORITY);
                    }

                    else if(Game.time - Memory.scouting.rooms[roomName].lastColonyScout > scoutInterval) {
                        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_SCOUTING_PRIORITY);
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
            
        if(scoutingInfo.sourceInfo === undefined) {
            var sourceInfo = {};
            var primaryHeartPos = this.colony.primaryRoom.find(FIND_FLAGS, {filter: function(f) { return f.name.startsWith('!CHUNK|heart') }})[0].pos;
    
            if(primaryHeartPos !== undefined) {
                var sourcesInRoom = room.find(FIND_SOURCES);
                for(var i = 0; i < sourcesInRoom.length; i++) {
                    var source = sourcesInRoom[i];
    
                    sourceInfo[source.id] = {
                        'distanceToPrimaryHeart': primaryHeartPos.findPathTo(source).length,
                        'pos': {
                            'x': source.pos.x,
                            'y': source.pos.y,
                            'roomName': source.pos.roomName
                        } 
                    }
                }
            }

            scoutingInfo.sourceInfo = sourceInfo;
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