//Needs a "can spawn" function
//Needs a "spawn creep" function
    //Need some ability to prevent it from attempting to spawn multiple creeps from one spawner
//Needs a "homeroom" object

var BodyGenerator = require('BodyGenerator');

var COLONY_MAX_RANGE = 2;
var COLONY_MAX_ROOMS_TO_TRAVEL = 2;

var COLONY_INFO_UPDATE_FREQUENCY = 200; //Update every 100 ticks

class Colony {
    /*
    this.primaryRoom = Room
    this.rooms = {roomName: Room}

    this.availableSpawns = {
        'ENERGY_CAPACITY1': [],
        'ENERGY_CAPACITY2': []
    };
    this.timeTillAvailableSpawn = 0;
    this.activeSources = [Source]
    this.depletedSources = [Source]

    this.colonyRoomInfo = {} //Info about all rooms near colony
    */

    constructor(name) {
        this.name = name;
        this.memory = Memory.colonies[name];
        this.primaryRoom = Game.rooms[this.memory['primaryRoomName']];

        if(this.memory['secondaryRoomName'] !== undefined) {
            this.secondaryRoom = Game.rooms[this.memory['secondaryRoomName']];
        }

        if(this.memory.colonyRoomInfo === undefined || Game.time % COLONY_INFO_UPDATE_FREQUENCY === 0) {
            this.initColonyRoomInfo();
        }
        this.colonyRoomInfo = this.memory.colonyRoomInfo;
        this.initSpawnInfo();
        this.initMiningInfo();
        //this.drawColonyInfo();
    }

    initColonyRoomInfo() {
        var colonyRoomInfo = {};

        var roomsToSearch = Object.values(Game.map.describeExits(this.primaryRoom.name));

        //Shift roomsToSearch
            //Check if it is defined in colonyRoomInfo - continue if so
            //Check if it is far away from both the secondaryRoom and the primaryRoom
            //If not, write down its name, and calculate its distanceFromPrimary & distanceFromSecondary
                //Also put its exits into roomsToSearch

        var secondaryExists = (this.secondaryRoom !== undefined);

        while(roomsToSearch.length > 0) {
            var roomName = roomsToSearch.shift();

            if(colonyRoomInfo[roomName] !== undefined) {
                continue;
            }

            var distToRoom = Game.map.getRoomLinearDistance(roomName, this.primaryRoom.name);

            if(secondaryExists) {
                var distToSecondary = Game.map.getRoomLinearDistance(roomName, this.secondaryRoom.name);
                if(distToSecondary < distToRoom) {
                    distToRoom = distToSecondary;
                }
            }

            if(distToRoom > COLONY_MAX_RANGE) {
                continue;
            }

            colonyRoomInfo[roomName] = {
                'roomName': roomName,
                'distanceFromPrimary': Game.map.getRoomLinearDistance(roomName, this.primaryRoom.name)
            };

            if(secondaryExists) {
                colonyRoomInfo[roomName]['distanceFromSecondary'] = Game.map.getRoomLinearDistance(roomName, this.secondaryRoom.name);
            }

            var adjacentRooms = Object.values(Game.map.describeExits(roomName));
            roomsToSearch = roomsToSearch.concat(adjacentRooms);
        }

        this.memory.colonyRoomInfo = colonyRoomInfo;
    }
    
    get roomsByDistance() {
        /*
            for(var i in roomsByDistance[distance]) {
                var roomName = roomsByDistance[distance][i].roomName;
                ...
            }
        */

        return _.groupBy(this.colonyRoomInfo, function(roomInfo) {
            return roomInfo.distanceFromPrimary.toString();
        });
    }

    initSpawnInfo() {
        var primaryRoomSpawns = this.primaryRoom.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_SPAWN }});
        var spawns = primaryRoomSpawns;

        if(this.secondaryRoom !== undefined) {
            var secondaryRoomSpawns = this.secondaryRoom.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_SPAWN }});
            spawns = primaryRoomSpawns.concat(secondaryRoomSpawns);
        }

        this.spawns = spawns;
        this.availableSpawns = {};
        this.timeTillAvailableSpawn = 1000;
        //How long till we can spawn, how many can we spawn?
        for(var i = 0; i < spawns.length; i++) {
            var spawn = spawns[i];

            if(spawn.spawning === null) {
                this.timeTillAvailableSpawn = 0;

                var energyCapacity = spawn.room.energyCapacityAvailable.toString();

                if(this.availableSpawns[energyCapacity] === undefined) {
                    this.availableSpawns[energyCapacity] = [spawn];
                }
                
                else {
                    this.availableSpawns[energyCapacity].push(spawn);
                }
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

    spawnIsAvailable(creepBodyType, energyRequired=undefined) {
        if(energyRequired === undefined) {
            energyRequired = 0;
        }
        var body = BodyGenerator.generateBody(creepBodyType, energyRequired);

        var energyToSpend = BodyGenerator.getCostOfBody(body);

        for(var energyCapacity in this.availableSpawns) {
            if(parseInt(energyCapacity) < energyToSpend) {
                continue;
            }

            if(this.availableSpawns[energyCapacity].length > 0) {
                return true;
            }
        }

        return false;
    }

    getCapableSpawn(creepBodyType, energyRequired=undefined) {
        if(energyRequired === undefined) {
            energyRequired = 0;
        }
        var body = BodyGenerator.generateBody(creepBodyType, energyRequired);

        var energyToSpend = BodyGenerator.getCostOfBody(body);

        var spawnToUse = false;

        for(var energyCapacity in this.availableSpawns) {
            if(parseInt(energyCapacity) < energyToSpend) {
                continue;
            }

            if(this.availableSpawns[energyCapacity].length > 0) {
                var firstSpawnInRoom = this.availableSpawns[energyCapacity][0];
                spawnToUse = firstSpawnInRoom;

                if(firstSpawnInRoom.room.energyAvailable >= energyToSpend)  {
                    break;
                }
            }
        }

        return spawnToUse;
    }

    removeCapableSpawn(creepBodyType, energyRequired=undefined) {
        if(energyRequired === undefined) {
            energyRequired = 0;
        }

        var spawn = this.getCapableSpawn(creepBodyType, energyRequired);

        if(spawn !== false) {
            var energyCapacity = spawn.room.energyCapacityAvailable;
            if(this.availableSpawns[energyCapacity].length > 0) {
                this.availableSpawns[energyCapacity].shift();
                return true;
            }
        }

        return false;
    }

    getClosestStorage(position) {
        var closestStorage = undefined;
        var distance = 10000000000;

        if(this.primaryRoom.storage !== undefined) {
            distance = PathFinder.search(position, this.primaryRoom.storage.pos).path.length;
            closestStorage = this.primaryRoom.storage;
        }

        if(this.secondaryRoom !== undefined && this.secondaryRoom.storage !== undefined) {
            var secondaryDistance = PathFinder.search(position, this.secondaryRoom.storage.pos).path.length;

            if(secondaryDistance < distance) {
                closestStorage = this.secondaryRoom.storage;
            }
        }

        return closestStorage;
    }

    initMiningInfo() {
        this.activeSources = [];
        this.safeSources = [];

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

                if(!isSkRoom) {
                    this.safeSources.push(source);
                }
            }
        }

        this.sortedSafeSourceInfo = this.getSafeSourceInfoByMineableDistance();
    }

    getColonyRoomScoutingInfo() {
        var scoutingInfo = {};

        for(var roomName in this.colonyRoomInfo) {
            scoutingInfo[roomName] = Memory.scouting['rooms'][roomName]
        }

        return scoutingInfo;
    }

    getSafeSourceInfoByMineableDistance() {
        var roomInfoArray = this.getColonyRoomScoutingInfo();

        var colonySafeSourceInfo = [];

        for(var roomName in roomInfoArray) {
            var roomInfo = roomInfoArray[roomName];

            if(roomInfo === undefined) continue;
            if(roomInfo['isSkRoom'] === true) continue;

            for(var sourceId in roomInfo['sourceInfo']) {
                var sourceInfo = roomInfo['sourceInfo'][sourceId];

                colonySafeSourceInfo.push(sourceInfo);
            }
        }

        var secondaryRoom = this.secondaryRoom;

        var sortedInfo = _.sortBy(colonySafeSourceInfo, function(sourceInfo) {
            var distance = sourceInfo['distanceToPrimaryHeart'];
            var secondaryHeartDistance = sourceInfo['distanceToSecondaryHeart'];
            if(secondaryRoom !== undefined && secondaryRoom.storage !== undefined && secondaryHeartDistance !== undefined && secondaryHeartDistance < distance) {
                distance = secondaryHeartDistance;
            }

            console.log('hi');
            console.log(sourceInfo.pos.roomName + " " + distance);
            return distance;
        });

        console.log('Sup dood');

        return sortedInfo;
    }

    removeFromActiveSources(sourceToRemove) {
        for(var i = 0; i < this.activeSources.length; i++) {
            var activeSource = this.activeSources[i];

            if(activeSource.id === sourceToRemove.id) {
                this.activeSources.splice(i, 1);
                break;
            }
        }
    }

    spawnCreep(creepName, creepBodyType, creepProcessClass, creepMemory, creepPriority, maxEnergyToSpend=undefined) {
        var spawn = this.getCapableSpawn(creepBodyType, maxEnergyToSpend);

        if(spawn !== false) {
            //Energy to spend is either the room's capacity, or min of max vs current

            var energyToSpend = (maxEnergyToSpend === undefined) ? spawn.room.energyCapacityAvailable : Math.min(spawn.room.energyAvailable, maxEnergyToSpend);

            var body = BodyGenerator.generateBody(creepBodyType, energyToSpend);
            //Try to spawn.  If we can, add the process to the scheduler.  If not, print why

            creepMemory['spawningColonyName'] = this.name;
            creepMemory['pid'] = 'creep|' + creepName;
            creepMemory['creepProcessClass'] = creepProcessClass;
            creepMemory['creepPriority'] = creepPriority;
            creepMemory['bodyType'] = creepBodyType;

            var spawnResult = spawn.spawnCreep(body, creepName, {memory: creepMemory});

            if(spawnResult === OK) {
                console.log('Spawning creep ' + creepName);

                this.removeCapableSpawn(creepBodyType, maxEnergyToSpend);
            }
            
            else if(spawnResult === ERR_NOT_ENOUGH_ENERGY) {
                //Draw the name of the creep your'e trying to spawn
                console.log("Waiting for energy for creep " + creepName);
                console.log('Creep Dump: ' + creepName + ' ' + body);

                spawn.room.visual.text(creepName, spawn.pos);
                this.removeCapableSpawn(creepBodyType, maxEnergyToSpend);
            }

            else {
                console.log('Error spawning creep ' + spawnResult);
                console.log('Creep Dump: ' + creepName + ' ' + body);
            }
        }
    }
}

module.exports = Colony;