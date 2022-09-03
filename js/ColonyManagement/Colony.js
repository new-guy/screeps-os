var BodyGenerator = require('BodyGenerator');
var Roadmap = require('Roadmap');

class Colony {
    constructor(name) {
        this.name = name;
        this.memory = Memory.colonies[name];
        if(this.memory['primaryRoomName'] == null) this.memory['primaryRoomName'] = this.name;
        this.primaryRoom = Game.rooms[this.memory['primaryRoomName']];

        if(this.memory['secondaryRoomName'] != null) {
            this.secondaryRoom = Game.rooms[this.memory['secondaryRoomName']];
        }

        if(this.memory.colonyRoomInfo == null || Game.time % COLONY_INFO_UPDATE_FREQUENCY === 0) {
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
        if(this.memory.colonyRoomInfo == null) this.memory.colonyRoomInfo = {};
        var colonyRoomInfo = this.memory.colonyRoomInfo;

        var roomsToEvaluate = Object.values(Game.map.describeExits(this.primaryRoom.name));
        var secondaryIsDetermined = (this.secondaryRoom != null);
        var evaluatedRooms = [];

        if(this.memory.manuallyAddedRooms != null) {
            roomsToEvaluate = roomsToEvaluate.concat(this.memory.manuallyAddedRooms);
        }

        while(roomsToEvaluate.length > 0) {
            var roomName = roomsToEvaluate.shift();

            if(evaluatedRooms.includes(roomName)) {
                continue;
            }

            if(Game.map.getRoomStatus(roomName).status === 'closed') {
                continue;
            }

            if(this.roomIsOutOfRange(roomName) && !this.memory.manuallyAddedRooms.includes(roomName)) {
                continue;
            }

            var roomColonyName = this.getColonyNameOfRoom(roomName);
            if(roomColonyName != null && roomColonyName !== this.name) {
                continue;
            }

            if(colonyRoomInfo[roomName] == null) {
                colonyRoomInfo[roomName] = {};
            }

            colonyRoomInfo[roomName]['roomName'] = roomName;
            colonyRoomInfo[roomName]['distanceFromPrimary'] = Game.map.getRoomLinearDistance(roomName, this.primaryRoom.name);
            colonyRoomInfo[roomName]['stepsToPrimary'] = Game.map.findRoute(roomName, this.primaryRoom.name).length;

            if(secondaryIsDetermined) {
                colonyRoomInfo[roomName]['distanceFromSecondary'] = Game.map.getRoomLinearDistance(roomName, this.secondaryRoom.name);
                colonyRoomInfo[roomName]['stepsToSecondary'] = Game.map.findRoute(roomName, this.secondaryRoom.name).length;
            }

            if(Memory.rooms[roomName] == null) {
                Memory.rooms[roomName] = {
                    'colonyName': this.name
                }
            }

            else {
                Memory.rooms[roomName]['colonyName'] = this.name;
            }

            var adjacentRooms = Object.values(Game.map.describeExits(roomName));
            roomsToEvaluate = roomsToEvaluate.concat(adjacentRooms);

            evaluatedRooms.push(roomName);
        }

        this.memory.colonyRoomInfo = colonyRoomInfo;
    }

    manuallyAddRoom(roomName) {
        if(this.memory.manuallyAddedRooms == null) {
            this.memory.manuallyAddedRooms = [];
        }

        if(Memory.rooms[roomName] == null) {
            Memory.rooms[roomName] = {};
        }

        Memory.rooms[roomName]['colonyName'] = this.name;

        if(!this.memory.manuallyAddedRooms.includes(roomName)) {
            this.memory.manuallyAddedRooms.push(roomName)
        }

        this.initColonyRoomInfo();
    }

    fullHardReset() {
        Memory.processes = undefined;
        Memory.creeps = undefined;

        for(var creepName in Game.creeps) {
            var creep = Game.creeps[creepName];
            if(creep.my) {
                creep.suicide();
            }
        }
    }

    getColonyNameOfRoom(roomName) {
        if(Memory.rooms[roomName] == null) return null;
        else {
            return Memory.rooms[roomName]['colonyName'];
        }
    }

    roomIsOutOfRange(roomName) {
        var linearDistToColony = Game.map.getRoomLinearDistance(roomName, this.primaryRoom.name);
        var secondaryIsDetermined = (this.secondaryRoom != null);

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

            if(room == null) continue;

            this.addBuildingPlanRoadsToMap(roomName);

            room.damagedRoads = room.find(FIND_STRUCTURES, {filter: function(s) {
                var isDamagedRoad = s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax;
                var isValidDamagedRoad = isDamagedRoad && roadmap.isRoad(s.pos); 
                if(isDamagedRoad && !isValidDamagedRoad) {
                    new RoomVisual(s.pos.roomName).circle(s.pos.x, s.pos.y, {opacity: 0.9, radius: 0.1, fill: '#ff7777'});
                }
                return isValidDamagedRoad;
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
        }
    }

    addBuildingPlanRoadsToMap(roomName) {
        if (Memory.rooms == null) return;
        if (Memory.rooms[roomName] == null) return;
        var buildingPlan = Memory.rooms[roomName].buildingPlan;

        if(buildingPlan == null) return;

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

            var mapDescriptor = this.name;
            if(this.primaryRoom.name === roomName) mapDescriptor += " | Pri";
            if(this.secondaryRoom != null && this.secondaryRoom.name === roomName) mapDescriptor += " | Sec";
            Game.map.visual.text(mapDescriptor, new RoomPosition(2, 2, roomName), {color: '#CCCCCC', fontSize: 5, align: 'left', opacity: 1.0});
        }
    }

    get isPreStorage() {
        var primaryIsPreStorage = (this.primaryRoom != null && this.primaryRoom.controller.level < 5 && this.primaryRoom.storage == null);
        var secondaryIsPreStorage = (this.secondaryRoom != null && this.secondaryRoom.controller.level < 5 && this.secondaryRoom.storage == null);
        return primaryIsPreStorage || secondaryIsPreStorage;
    }

    get energyAvailable () {
        var primaryEnergy = this.primaryRoom == null ? 0 : this.primaryRoom.energyAvailable;
        var secondaryEnergy = this.secondaryRoom == null ? 0 : this.secondaryRoom.energyAvailable;
        return primaryEnergy + secondaryEnergy;
    }

    get energyCapacityAvailable () {
        var primaryEnergy = this.primaryRoom == null ? 0 : this.primaryRoom.energyCapacityAvailable;
        var secondaryEnergy = this.secondaryRoom == null ? 0 : this.secondaryRoom.energyCapacityAvailable;
        return primaryEnergy + secondaryEnergy;
    }

    get nonFullFactories() {
        var primaryNonFullFactories = this.primaryRoom == null ? [] : this.primaryRoom.nonFullFactories;
        var secondaryNonFullFactories = this.secondaryRoom == null ? [] : this.secondaryRoom.nonFullFactories;

        if (primaryNonFullFactories == null) primaryNonFullFactories = [];
        if (secondaryNonFullFactories == null) secondaryNonFullFactories = [];
        return primaryNonFullFactories.concat(secondaryNonFullFactories);
    }

    get halfFullTowers() {
        var primaryHalfFullTowers = this.primaryRoom == null ? [] : this.primaryRoom.halfFullTowers;
        var secondaryHalfFullTowers = this.secondaryRoom == null ? [] : this.secondaryRoom.halfFullTowers;

        if (primaryHalfFullTowers == null) primaryHalfFullTowers = [];
        if (secondaryHalfFullTowers == null) secondaryHalfFullTowers = [];
        return primaryHalfFullTowers.concat(secondaryHalfFullTowers);
    }

    get constructionSites() {
        var primaryConstructionSites = this.primaryRoom == null ? [] : this.primaryRoom.constructionSites;
        var secondaryConstructionSites = this.secondaryRoom == null ? [] : this.secondaryRoom.constructionSites;

        if (primaryConstructionSites == null) primaryConstructionSites = [];
        if (secondaryConstructionSites == null) secondaryConstructionSites = [];
        return primaryConstructionSites.concat(secondaryConstructionSites);
    }
    
    get roomsByDistance() {
        return _.groupBy(this.colonyRoomInfo, function(roomInfo) {
            var distance = roomInfo.distanceFromPrimary.toString();

            if(roomInfo.distanceFromSecondary != null && roomInfo.distanceFromSecondary < roomInfo.distanceFromPrimary) {
                distance = roomInfo.distanceFromSecondary.toString();
            } 

            return distance
        });
    }

    get offenseFlags() {
        var flags = [];
        var offenseFlagPrefix = '!OFFENSE|'+this.name;
        for(var flagName in Game.flags) {
            var flag = Game.flags[flagName];

            if(flag.name.startsWith(offenseFlagPrefix)) flags.push(flag);
        }

        return flags;
    }

    get roomsNeedingBuilder() {
        var rooms = [];
        for(var roomName in this.colonyRoomInfo) {
            var room = Game.rooms[roomName];

            if(room == null) continue;

            else {
                if( room.constructionSites != null && room.constructionSites.length > 0 || 
                    room.rampartsNeedingRepair != null && room.rampartsNeedingRepair.length > 0 || 
                    room.wallsNeedingRepair != null && room.wallsNeedingRepair.length > 0) {
                    rooms.push(room);
                }
            }
        }

        return rooms;
    }

    get roomsNeedingRoadRepairs() {
        var rooms = [];
        for(var roomName in this.colonyRoomInfo) {
            var room = Game.rooms[roomName];

            if(room == null) continue;

            else {
                if(room.damagedRoads != null && room.damagedRoads.length > 0) {
                    rooms.push(room);
                }
            }
        }

        return rooms;
    }

    get roomNeedingRoadRepairs() {
        var rooms = this.roomsNeedingRoadRepairs;
        // - Go to room that needs critical repairs

        var needyRoom = null;
        var needyRoadPercent = 100;

        for(var i = 0; i < rooms.length; i++) {
            var room = rooms[i];

            if(room.controller != null && room.controller.my && room.controller.level >= 4 && room.storage == null) {
            //If we don't have a storage and should, then this is the top room to work on
                needyRoom = room;
                break;
            }

            if(room.mostDamagedRoad != null && room.mostDamagedRoad.hits/room.mostDamagedRoad.hitsMax < needyRoadPercent && room.mostDamagedRoad.hits/room.mostDamagedRoad.hitsMax < COLONY_ROAD_HITS_CRITICAL_THRESHOLD) {
                needyRoom = room;
                needyRoadPercent = room.mostDamagedRoad.hits/room.mostDamagedRoad.hitsMax;
            }
        }

        return needyRoom;
    }

    get roomMostNeedingBuilder() {
        var rooms = this.roomsNeedingBuilder;
        // - Build in room that has the least construction sites, then most repair sites
        var needyRoom = null;
        var constructionSites = 10000000000000000000;
        var repairSites = 0;

        for(var i = 0; i < rooms.length; i++) {
            var room = rooms[i];
            if((room.name === this.primaryRoom.name || (this.secondaryRoom != null && room.name === this.secondaryRoom.name)) && room.harvestDestination == null && room.constructionSites.length > 0) {
                needyRoom = room;
                console.log('Set most needed to ' + room.name + ' because harvestDest missing');
                break;
            }

            else if(room.constructionSites != null && room.constructionSites.length > 0 && room.constructionSites.length < constructionSites) {
                needyRoom = room;
                constructionSites = room.constructionSites.length;
            }

            else if( needyRoom == null && (
                     room.rampartsNeedingRepair != null && room.rampartsNeedingRepair.length > 0 || 
                     room.wallsNeedingRepair != null && room.wallsNeedingRepair.length > 0)) {
                var roomRepairSites = 0;
                if(room.rampartsNeedingRepair != null) roomRepairSites += room.rampartsNeedingRepair.length;
                if(room.wallsNeedingRepair != null) roomRepairSites += room.wallsNeedingRepair.length;

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
        if(miningManager.memory.children != null) {
            for(var i = 0; i < miningManager.memory.children.length; i++) {
                miningProcesses.push(Game.scheduler.getProcess(miningManager.memory.children[i]));
            }
        }

        return miningProcesses;
    }

    get controllerToUpgrade() {
        var primaryController = this.primaryRoom.controller;
        var controller = primaryController;

        if(this.secondaryRoom != null && this.secondaryRoom.controller.my) {
            var secondaryController = this.secondaryRoom.controller;
            if(secondaryController.level < primaryController.level) {
                controller = secondaryController;
            }
            else if(secondaryController.level === primaryController.level) {
                controller = secondaryController.progress > primaryController.progress ? secondaryController : primaryController;
            }
            else {
                controller = primaryController;
            }
        }

        return controller;
    }

    get hasNecessaryMinimumEnergy() {
        var hasMinEnergy = this.primaryRoom.hasNecessaryMinimumEnergy();

        if(this.secondaryRoom != null) hasMinEnergy = hasMinEnergy || this.secondaryRoom.hasNecessaryMinimumEnergy();

        return hasMinEnergy;
    }

    get invadedRoomToDefend() {
        for(var roomName in this.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            if(room == null) continue;

            var hasLoneInvaderCore = room.hasLoneInvaderCore();
            var hasInvaders = room.hasInvaders();
            var hasEnemies = room.enemies.length > 0;

            if(hasLoneInvaderCore || hasInvaders || hasEnemies) {
                console.log('Selected ' + room.name + ' for invader defense')
                return room;
            }
        }
    }

    initSpawnInfo() {
        var primaryRoomSpawns = this.primaryRoom.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_SPAWN }});
        var spawns = primaryRoomSpawns;

        if(this.secondaryRoom != null) {
            var secondaryRoomSpawns = this.secondaryRoom.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_SPAWN }});
            spawns = primaryRoomSpawns.concat(secondaryRoomSpawns);
        }

        this.spawns = spawns;
        this.availableSpawns = {};
        this.timeTillAvailableSpawn = 1000;
        //Set time till available spawn if everything is spawning
        //For every spawn that isn't spawning, add its energy capacity to an array
        //We use this array to select spawns that can create the desired unit 
        //- this is necessary for us to avoid assigning a creep to a spawn that is too small to make it
        for(var i = 0; i < spawns.length; i++) {
            var spawn = spawns[i];

            if(spawn.spawning == null) {
                this.timeTillAvailableSpawn = 0;

                var energyCapacity = spawn.room.energyCapacityAvailable.toString();

                if(this.availableSpawns[energyCapacity] == null) {
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

        //Also set Colony Max Energy Capacity
        this.maxEnergyCapacityAvailable = 0;

        for(var i = 0; i < this.spawns.length; i++) {
            var energyCapacity = this.spawns[i].room.energyCapacityAvailable;
            if(energyCapacity > this.maxEnergyCapacityAvailable) {
                this.maxEnergyCapacityAvailable = energyCapacity;
            }
        }
    }

    spawnIsAvailable(creepBodyType, energyRequired=null) {
        if(energyRequired == null) {
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

    getCapableSpawn(creepBodyType, energyRequired=null) {
        if(energyRequired == null) {
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

    removeCapableSpawn(creepBodyType, energyRequired=null) {
        if(energyRequired == null) {
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

    getClosestHarvestDestination(position, energyNeeded=null, hasMinimum=false) {
        var closestHarvestDestination = null;
        var distance = 10000000000;

        if(this.primaryRoom.hasEnergyInHarvestDestination(energyNeeded, hasMinimum)) {
            distance = PathFinder.search(position, this.primaryRoom.harvestDestination.pos).path.length;
            closestHarvestDestination = this.primaryRoom.harvestDestination;
        }

        if(this.secondaryRoom != null && this.secondaryRoom.hasEnergyInHarvestDestination(energyNeeded, hasMinimum)) {
            var secondaryDistance = PathFinder.search(position, this.secondaryRoom.harvestDestination.pos).path.length;

            if(secondaryDistance < distance) {
                closestHarvestDestination = this.secondaryRoom.harvestDestination;
            }
        }

        return closestHarvestDestination;
    }

    initMiningInfo() {
        this.activeSources = [];
        this.safeSources = [];

        for(var roomName in this.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            if(room == null) continue;

            if(Game.recon.isRoomNameDangerous(roomName)) continue; //Avoid dangerous rooms
            if(room.hasInvaders() || room.hasInvaderStructures()) continue; //Ignore invader rooms

            var isSkRoom = (Memory.scouting.rooms[roomName] != null && Memory.scouting.rooms[roomName]['isSkRoom'] === true);
            var isEnemyRoom = (room.controller != null && room.controller.owner != null && !room.controller.my);

            if(isSkRoom || isEnemyRoom) continue;

            var sourcesInRoom = room.find(FIND_SOURCES);

            for(var i = 0; i < sourcesInRoom.length; i++) {
                var source = sourcesInRoom[i];

                if(source.energy > 0 && source.pos.hasOpenAdjacentTile()) {
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

            if(roomInfo == null) continue;
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
            if(secondaryRoom != null && secondaryRoom.storage != null && secondaryHeartDistance != null && secondaryHeartDistance < distance) {
                distance = secondaryHeartDistance;
            }
            return distance;
        });

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

    spawnCreep(creepName, creepPid, creepBodyType, creepProcessClass, creepMemory, creepProcessPriority, maxEnergyToSpend=null) {
        var spawn = this.getCapableSpawn(creepBodyType, maxEnergyToSpend);

        if(spawn !== false) {
            //Energy to spend is either the room's capacity, or min of max vs current

            var energyToSpend = (maxEnergyToSpend == null) ? spawn.room.energyCapacityAvailable : Math.min(spawn.room.energyAvailable, maxEnergyToSpend);

            var body = BodyGenerator.generateBody(creepBodyType, energyToSpend);
            //Try to spawn.  If we can, add the process to the scheduler.  If not, print why

            creepMemory['spawningColonyName'] = this.name;
            creepMemory['pid'] = creepPid;
            creepMemory['creepProcessClass'] = creepProcessClass;
            creepMemory['bodyType'] = creepBodyType;

            var canSpawn = spawn.spawnCreep(body, creepName, {memory: creepMemory, dryRun: true});
            if(canSpawn === OK) {
                console.log(spawn.name + ' Spawning creep ' + creepName);
                spawn.spawnCreep(body, creepName, {memory: creepMemory});
                Game.scheduler.addProcess(creepMemory['pid'], creepProcessClass, {'creepName': creepName}, creepProcessPriority);

                this.removeCapableSpawn(creepBodyType, maxEnergyToSpend);
            }
            
            else if(canSpawn === ERR_NOT_ENOUGH_ENERGY) {
                //Draw the name of the creep your'e trying to spawn
                console.log(spawn.name + " Waiting for energy for creep " + creepName);
                console.log('Creep Dump: ' + creepName + ' ' + body);

                spawn.room.visual.text(creepName, spawn.pos.x, spawn.pos.y+1);
                this.removeCapableSpawn(creepBodyType, maxEnergyToSpend);
                var newSpawn = this.getCapableSpawn(creepBodyType, maxEnergyToSpend);
                if(newSpawn != null) {
                    this.spawnCreep(creepName, creepPid, creepBodyType, creepProcessClass, creepMemory, creepProcessPriority, maxEnergyToSpend=null)
                }
            }

            else {
                console.log('Error spawning creep ' + canSpawn);
                console.log('Creep Dump: ' + creepName + ' ' + body);
            }
        }
    }
}

module.exports = Colony;