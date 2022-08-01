var BodyGenerator = require('BodyGenerator');
var Roadmap = require('Roadmap');

class Colony {
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
        this.drawColonyInfo();

        this.roadmap = new Roadmap(this);
        this.updateRooms();
    }

    initColonyRoomInfo() {
        if(this.memory.colonyRoomInfo === undefined) this.memory.colonyRoomInfo = {};
        var colonyRoomInfo = this.memory.colonyRoomInfo;

        var roomsToEvaluate = Object.values(Game.map.describeExits(this.primaryRoom.name));
        var secondaryIsDetermined = (this.secondaryRoom !== undefined);
        var evaluatedRooms = [];

        while(roomsToEvaluate.length > 0) {
            var roomName = roomsToEvaluate.shift();

            if(evaluatedRooms.includes(roomName)) {
                continue;
            }

            if(this.roomIsOutOfRange(roomName))

            if(colonyRoomInfo[roomName] === undefined) {
                colonyRoomInfo[roomName] = {};
            }

            colonyRoomInfo[roomName]['roomName'] = roomName;
            colonyRoomInfo[roomName]['distanceFromPrimary'] = Game.map.getRoomLinearDistance(roomName, this.primaryRoom.name);
            colonyRoomInfo[roomName]['stepsToPrimary'] = Game.map.findRoute(roomName, this.primaryRoom.name).length;

            if(secondaryIsDetermined) {
                colonyRoomInfo[roomName]['distanceFromSecondary'] = Game.map.getRoomLinearDistance(roomName, this.secondaryRoom.name);
                colonyRoomInfo[roomName]['stepsToSecondary'] = Game.map.findRoute(roomName, this.secondaryRoom.name).length;
            }

            var adjacentRooms = Object.values(Game.map.describeExits(roomName));
            roomsToEvaluate = roomsToEvaluate.concat(adjacentRooms);

            evaluatedRooms.push(roomName);
        }

        this.memory.colonyRoomInfo = colonyRoomInfo;
    }

    roomIsOutOfRange(roomName) {
        var linearDistToColony = Game.map.getRoomLinearDistance(roomName, this.primaryRoom.name);
        var secondaryIsDetermined = (this.secondaryRoom !== undefined);

        if(secondaryIsDetermined) {
            var distToSecondary = Game.map.getRoomLinearDistance(roomName, this.secondaryRoom.name);
            if(distToSecondary < linearDistToColony) {
                linearDistToColony = distToSecondary;
            }
        }

        if(linearDistToColony > COLONY_MAX_RANGE) {
            return true;
        }

        var stepsToColony = Game.map.findRoute(roomName, this.primaryRoom.name).length;

        if(secondaryIsDetermined) {
            var stepsToSecondary = Game.map.findRoute(roomName, this.secondaryRoom.name).length;
            if(stepsToSecondary < stepsToColony) {
                stepsToColony = stepsToSecondary;
            }
        }

        if(stepsToColony > COLONY_MAX_ROOMS_TO_TRAVEL) {
            return true;
        }

        return false;
    }

    updateRooms() {
        var roadmap = this.roadmap;

        for(var roomName in this.colonyRoomInfo) {
            var room = Game.rooms[roomName];

            if(room === undefined) continue;

            this.addBuildingPlanRoadsToMap(roomName);

            room.damagedRoads = room.find(FIND_STRUCTURES, {filter: function(s) { 
                return s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax && roadmap.isRoad(s.pos); 
            }});
    
            if(room.damagedRoads.length > 0) {
                room.mostDamagedRoad = room.damagedRoads[0];
        
                for(var i = 1 ; i < room.damagedRoads.length; i++) {
                    var road = room.damagedRoads[i];
                    if(road.hits < room.mostDamagedRoad.hits) {
                        room.mostDamagedRoad = road;
                    }
                }
            }

            room.constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
            room.mostBuiltConstructionSite = room.constructionSites[0];

            for(var i = 0; i < room.constructionSites.length; i++) {
                var constructionSite = room.constructionSites[i];

                if(constructionSite.progress > room.mostBuiltConstructionSite.progress) {
                    room.mostBuiltConstructionSite = constructionSite;
                }
            }
        }
    }

    addBuildingPlanRoadsToMap(roomName) {
        if (Memory.rooms == undefined) return;
        if (Memory.rooms[roomName] == undefined) return;
        var buildingPlan = Memory.rooms[roomName].buildingPlan;

        if(buildingPlan === undefined) return;

        for(var x = 0; x < buildingPlan.length; x++) {
            for(var y = 0; y < buildingPlan[x].length; y++) {
                var structureType = buildingPlan[x][y];

                if(structureType === 'road') {
                    var pos = new RoomPosition(x, y, roomName);
                    this.roadmap.setRoad(pos);
                }
            }
        }
    }

    drawColonyInfo() {
        for(var roomName in this.colonyRoomInfo) {
            var visual = new RoomVisual(roomName);
            var colonyRoomInfo = this.colonyRoomInfo[roomName];

            visual.text('Col: ' + this.name, 1, 1, {align: 'left'});
            visual.text('Pri: ' + colonyRoomInfo['distanceFromPrimary'], 1, 2, {align: 'left'});
            visual.text('Sec: ' + colonyRoomInfo['distanceFromSecondary'], 1, 3, {align: 'left'});
        }
    }
    
    get roomsByDistance() {
        return _.groupBy(this.colonyRoomInfo, function(roomInfo) {
            var distance = roomInfo.distanceFromPrimary.toString();

            if(roomInfo.distanceFromSecondary !== undefined && roomInfo.distanceFromSecondary < roomInfo.distanceFromPrimary) {
                distance = roomInfo.distanceFromSecondary.toString();
            } 

            return distance
        });
    }

    get roomsNeedingBuilder() {
        var rooms = [];
        for(var roomName in this.colonyRoomInfo) {
            var room = Game.rooms[roomName];

            if(room === undefined) continue;

            else {
                if( room.constructionSites !== undefined && room.constructionSites.length > 0 || 
                    room.rampartsNeedingRepair !== undefined && room.rampartsNeedingRepair.length > 0 || 
                    room.wallsNeedingRepair !== undefined && room.wallsNeedingRepair.length > 0 || 
                    room.damagedRoads !== undefined && room.damagedRoads.length > 0) {
                    rooms.push(room);
                }
            }
        }

        return rooms;
    }

    get roomNeedingCriticalRepairs() {
        var rooms = this.roomsNeedingBuilder;
        // - Go to room that needs critical repairs

        var needyRoom = undefined;

        for(var i = 0; i < rooms.length; i++) {
            var room = rooms[i];

            if(room.mostDamagedRoad !== undefined && room.mostDamagedRoad.hits/room.mostDamagedRoad.hitsMax < COLONY_ROAD_HITS_CRITICAL_THRESHOLD) {
                needyRoom = room;
                break;
            }
        }

        return needyRoom;
    }

    get roomMostNeedingBuilder() {
        var rooms = this.roomsNeedingBuilder;
        // - Build in room that has the least construction sites, then most repair sites

        var needyRoom = undefined;
        var constructionSites = 10000000000000000000;
        var repairSites = 0;

        for(var i = 0; i < rooms.length; i++) {
            var room = rooms[i];

            if(room.constructionSites !== undefined && room.constructionSites.length > 0 && room.constructionSites.length < constructionSites) {
                needyRoom = room;
                constructionSites = room.constructionSites.length;
                console.log('Set most needed to ' + room.name);
            }

            else if( needyRoom !== undefined && (needyRoom.constructionSites === undefined || room.constructionSites.length === 0) && (
                     room.rampartsNeedingRepair !== undefined && room.rampartsNeedingRepair.length > 0 || 
                     room.wallsNeedingRepair !== undefined && room.wallsNeedingRepair.length > 0 || 
                     room.damagedRoads !== undefined && room.damagedRoads.length > 0)) {
                
                var roomRepairSites = 0;
                if(room.rampartsNeedingRepair !== undefined) roomRepairSites += room.rampartsNeedingRepair.length;
                if(room.wallsNeedingRepair !== undefined) roomRepairSites += room.wallsNeedingRepair.length;
                if(room.damagedRoads !== undefined) roomRepairSites += room.damagedRoads.length;

                if(roomRepairSites > repairSites) {
                    repairSites = roomRepairSites;
                    needyRoom = room;
                }
            }
        }

        return needyRoom;
    }

    get miningProcesses() {
        var miningManager = Game.scheduler.getProcess(this.name + '|energyHarvestingManager');
        var miningProcesses = [];
        if(miningManager.memory.children !== undefined) {
            for(var i = 0; i < miningManager.memory.children.length; i++) {
                miningProcesses.push(Game.scheduler.getProcess(miningManager.memory.children[i]));
            }
        }

        return miningProcesses;
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

    getClosestStorage(position, energyNeeded=undefined) {
        var closestStorage = undefined;
        var distance = 10000000000;

        if(this.primaryRoom.storage !== undefined && (energyNeeded === undefined || this.primaryRoom.storage.store[RESOURCE_ENERGY] >= energyNeeded)) {
            distance = PathFinder.search(position, this.primaryRoom.storage.pos).path.length;
            closestStorage = this.primaryRoom.storage;
        }

        if(this.secondaryRoom !== undefined && this.secondaryRoom.storage !== undefined && (energyNeeded === undefined || this.secondaryRoom.storage.store[RESOURCE_ENERGY] >= energyNeeded)) {
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