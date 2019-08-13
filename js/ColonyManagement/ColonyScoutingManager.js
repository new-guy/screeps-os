const Process = require('Process');

var SCOUT_INTERVAL = 6000;

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

        var roomsByDistance = _.groupBy(this.colony.colonyRoomInfo, function(roomInfo) {
            return roomInfo.travelDistance.toString();
        });

        for(var distance in roomsByDistance) {
            console.log(distance)

            for(var i in roomsByDistance[distance]) {
                var roomName = roomsByDistance[distance][i].roomName;

                console.log('Checking if we should scout ' + roomName);

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

                    else if(Game.time - Memory.scouting.rooms[roomName].lastColonyScout > SCOUT_INTERVAL) {
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
            var primaryHeartPos = this.colony.homeRoom.find(FIND_FLAGS, {filter: function(f) { return f.name.startsWith('!CHUNK|heart') }})[0].pos;
    
            if(primaryHeartPos !== undefined) {
                var sourcesInRoom = room.find(FIND_SOURCES);
                for(var i = 0; i < sourcesInRoom.length; i++) {
                    var source = sourcesInRoom[i];
    
                    sourceInfo[source.id] = {
                        'distanceToPrimaryHeart': primaryHeartPos.findPathTo(source).length
                    }
                }
            }

            scoutingInfo.sourceInfo = sourceInfo;
        }

        if(scoutingInfo.skLairs === undefined) {
            var skLairs = room.find(FIND_HOSTILE_STRUCTURES, {filter: function(s) { return s.structureType === STRUCTURE_KEEPER_LAIR }});
    
            var isSkRoom = skLairs.length > 0;
    
            scoutingInfo.isSkRoom = isSkRoom;
        }

        scoutingInfo.lastColonyScout = Game.time;
    }

    processShouldDie() {
        return this.colony === undefined;
    }
}

module.exports = ColonyScoutingManager;