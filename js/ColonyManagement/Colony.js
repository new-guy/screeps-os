//Needs a "can spawn" function
//Needs a "spawn creep" function
    //Need some ability to prevent it from attempting to spawn multiple creeps from one spawner
//Needs a "homeroom" object

var BodyGenerator = require('BodyGenerator');

var COLONY_MAX_RANGE = 2;
var COLONY_MAX_ROOMS_TO_TRAVEL = 2;

class Colony {
    /*
    this.homeRoom = Room
    this.rooms = {roomName: Room}

    this.availableSpawns = [];
    this.timeTillAvailableSpawn = 0;
    this.activeSources = [Source]
    this.depletedSources = [Source]

    this.colonyRoomInfo = {} //Info about all rooms near colony
    */

    constructor(name) {
        this.name = name;
        this.memory = Memory.colonies[name];
        this.homeRoom = Game.rooms[this.memory['homeRoomName']];
        this.initColonyRoomInfo();
        this.initSpawnInfo();
        this.initMiningInfo();
    }

    initColonyRoomInfo() {
        if(this.memory.colonyRoomInfo === undefined) {
            var colonyRoomInfo = {};
            colonyRoomInfo[this.homeRoom.name] = {'roomName': this.homeRoom.name, 'travelDistance': 0};
            var roomsToSearch = Object.values(Game.map.describeExits(this.homeRoom.name));
            var currentTravelDistance = 1;
            var nextRoomsToSearch = [];

            while(currentTravelDistance <= COLONY_MAX_ROOMS_TO_TRAVEL) {
                for(var i = 0; i < roomsToSearch.length; i++) {
                    var roomName = roomsToSearch[i];

                    if(colonyRoomInfo[roomName] !== undefined || roomName === this.homeRoom.name) {
                        continue;
                    }

                    else if(Game.map.getRoomLinearDistance(roomName, this.homeRoom.name) > COLONY_MAX_RANGE) {
                        continue;
                    }

                    colonyRoomInfo[roomName] = {
                        'roomName': roomName,
                        'travelDistance': currentTravelDistance
                    };

                    var adjacentRooms = Object.values(Game.map.describeExits(roomName));
                    nextRoomsToSearch = nextRoomsToSearch.concat(adjacentRooms);
                }

                roomsToSearch = nextRoomsToSearch;
                nextRoomsToSearch = [];
                currentTravelDistance += 1;
            }

            this.memory.colonyRoomInfo = colonyRoomInfo;
        }

        this.colonyRoomInfo = this.memory.colonyRoomInfo;
    }

    initSpawnInfo() {
        var spawns = this.homeRoom.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_SPAWN }});

        this.spawns = spawns;
        this.availableSpawns = [];
        this.timeTillAvailableSpawn = 1000;
        //How long till we can spawn, how many can we spawn?
        for(var i = 0; i < spawns.length; i++) {
            var spawn = spawns[i];

            if(spawn.spawning === null) {
                this.timeTillAvailableSpawn = 0;
                this.availableSpawns.push(spawn);
            }

            else if (spawn.spawning.remainingTime < this.timeTillAvailableSpawn) {
                this.timeTillAvailableSpawn = spawn.spawning.remainingTime;
            }
        }

        //Also Max Energy Capacity
        this.maxEnergyCapacity = 0;

        for(var i = 0; i < this.spawns.length; i++) {
            var energyCapacity = this.spawns[i].room.energyCapacityAvailable;
            if(energyCapacity > this.maxEnergyCapacity) {
                this.maxEnergyCapacity = energyCapacity;
            }
        }
    }

    spawnIsAvailable() {
        return (this.availableSpawns.length > 0);
    }

    initMiningInfo() {
        this.activeSources = [];
        this.depletedSources = [];

        for(var roomName in this.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            if(room === undefined) continue;

            var sourcesInRoom = room.find(FIND_SOURCES);

            for(var i = 0; i < sourcesInRoom.length; i++) {
                var source = sourcesInRoom[i];

                var isSkRoom = (Memory.scouting.rooms[roomName] !== undefined && Memory.scouting.rooms[roomName]['isSkRoom'] === true);

                if(source.energy > 0 && source.pos.hasOpenAdjacentTile() && !isSkRoom) {
                    this.activeSources.push(source);
                }

                else {
                    this.depletedSources.push(source);
                }
            }
        }

        this.fallbackSourcePositions = [];

        for(var roomName in this.colonyRoomInfo) {
            var roomInfo = Memory.scouting.rooms[roomName];
            if(roomInfo === undefined) continue;

            else if(Game.rooms[roomName] !== undefined) { //we have vision - that means that we would've found active sources
                continue;
            }

            else if(roomInfo.isSkRoom === true) {
                continue;
            }

            else {
                for(var sourceId in roomInfo['sourceInfo']) {
                    var sourceInfo = roomInfo['sourceInfo'][sourceId];

                    var sourcePos = new RoomPosition(sourceInfo['pos']['x'], sourceInfo['pos']['y'], sourceInfo['pos']['roomName']);

                    this.fallbackSourcePositions.push(sourcePos);
                }
            }
        }
    //     Add a 'bootstrapperFallbackSources' property to the Colony where it just has a list of all of the following sources:
    // - scoutedSource that we don't have vision of that isn't in an sk room
    }

    spawnCreep(creepName, creepBodyType, creepProcessClass, creepMemory, creepPriority, scheduler, maxEnergyToSpend=undefined) {
        var spawn = this.availableSpawns[0];

        if(spawn === undefined) {
            console.log('No spawn available for ' + this.homeRoom.name);
        }

        else {
            //Energy to spend is either the room's capacity, or min of max vs current

            var energyToSpend = (maxEnergyToSpend === undefined) ? spawn.room.energyCapacityAvailable : Math.min(spawn.room.energyAvailable, maxEnergyToSpend);

            var body = BodyGenerator.generateBody(creepBodyType, energyToSpend);
            //Try to spawn.  If we can, add the process to the scheduler.  If not, print why

            creepMemory['spawningColonyName'] = this.name;

            var spawnResult = spawn.spawnCreep(body, creepName, {memory: creepMemory});

            if(spawnResult === OK) {
                console.log('Spawning creep ' + creepName);

                var pid = 'creep|' + creepName;
                scheduler.addProcess(pid, creepProcessClass, {'creepName': creepName}, creepPriority);
                this.availableSpawns.shift();
            }

            else {
                console.log('Error spawning creep ' + spawnResult);
                console.log('Creep Dump: ' + creepName + ' ' + body);
            }
        }
    }
}

module.exports = Colony;