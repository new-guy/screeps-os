const Process = require('Process');

class ColonyScoutingManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(!this.colony.primaryRoom.hasHeart()) return 'continue';

        var roomsByDistance = this.colony.roomsByDistance;

        for(var distance in roomsByDistance) {
            var scoutInterval = COLONY_DISTANCE_SCOUT_INTERVAL[distance];

            if(scoutInterval == null) scoutInterval = COLONY_DEFAULT_SCOUT_INTERVAL;

            for(var i in roomsByDistance[distance]) {
                var roomName = roomsByDistance[distance][i].roomName;

                var room = Game.rooms[roomName];

                if(room != null) {
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

                    if(distance === "1") spawnPriority = COLONY_ADJACENT_SCOUT_PRIORITY;

                    if(Game.recon.isRoomNameDangerous(roomName)) {
                        //If room is dangerous, we don't want to ensure scouting for it.
                        console.log('Room ' + roomName + ' is dangerous - not sending scout')
                        continue;
                    }

                    if(Memory.scouting.rooms[roomName] == null)  {
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
        if(Memory.scouting.rooms[room.name] == null) {
            Memory.scouting.rooms[room.name] = {};
        }

        var scoutingInfo = Memory.scouting.rooms[room.name];
            
        if(scoutingInfo.sourceInfo == null || scoutingInfo.lastFullColonyScout == null || Game.time - scoutingInfo.lastFullColonyScout > COLONY_ROOM_INFO_UPDATE_INTERVAL) {
            var fullSourceInfo = {};
            var primaryHeartPos = this.colony.primaryRoom.getHeartPos();
    
            if(primaryHeartPos != null) {
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

                    if(this.colony.secondaryRoom != null) {
                        var secondaryHeartPos = this.colony.secondaryRoom.find(FIND_FLAGS, {filter: function(f) { return f.name.startsWith('!CHUNK|heart') }})[0].pos;
                        var distToSecondary = PathFinder.search(source.pos, secondaryHeartPos).path.length;
                        fullSourceInfo[source.id]['distanceToSecondaryHeart'] = distToSecondary;
                    }
                }
            }
            scoutingInfo.lastFullColonyScout = Game.time;
            scoutingInfo.sourceInfo = fullSourceInfo;
        }

        scoutingInfo.isSkRoom = room.isSkRoom;

        scoutingInfo.lastColonyScout = Game.time;
    }

    processShouldDie() {
        return this.colony == null;
    }
}

module.exports = ColonyScoutingManager;