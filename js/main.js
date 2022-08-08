//Load non-process info
//Initialize the scheduler.  Load PID metadata from memory & sort it
//Run main scheduler loop
require('constants');
require('whitelist');

//Creep abilities
require('Targets');
require('Mining');
require('GenericCreepAbilities');
require('Upgrading');
require('CreepTools');

//Room functions
require('HomeRoomConstructionTools');
require('RoomTools');

//RoomPosition
require('RoomPositionTools');

const ReconTools = require('ReconTools');
const Scheduler = require('Scheduler');
const Colony = require('Colony');

//Stats
const Metrics = require('Metrics');

module.exports.loop = function() {
    Metrics.initForTick();
    initCustomObjects();

    const scheduler = new Scheduler();
    Game.scheduler = scheduler;
    scheduler.update();
    scheduler.garbageCollect();
    Metrics.update();
}

function initCustomObjects() {
    const recon = new ReconTools();
    Game.recon = recon;
    recon.update();

    initScouting();
    initEmpire();
    initColonies();
    initCreeps();
    initRooms();
}

function initScouting() {
    if(Memory.scouting === undefined) {
        Memory.scouting = {};
    } 
    
    if(Memory.scouting.rooms === undefined) {
        Memory.scouting.rooms = {};
    } 
}

function initEmpire() {
    Game.empire = {};

    var ownedRooms = _.filter(Game.rooms, function(r) { return r.controller !== undefined && r.controller.my && r.controller.level > 0 }).length;

    Game.empire.hasSpareGCL = ownedRooms < Game.gcl.level;
}

function initColonies() {
    initColonyMemory();
    initGameColonies();
}

function initColonyMemory() {
    if(Memory.colonies === undefined) {
        Memory.colonies = {};

        var spawn1 = Game.spawns['Spawn1'];
        Game.addColony(spawn1.room.name);

        spawn1.pos.createFlag('!CHUNK|heart|' + spawn1.room.name, COLOR_RED);
    }
}

Game.addColony = function(roomName) {
    Memory.colonies[roomName] = {
        'name': roomName,
        'primaryRoomName': roomName
    }
}

function initGameColonies() {
    Game.colonies = {};

    for(var roomName in Memory.colonies) {
        Game.colonies[roomName] = new Colony(roomName);
    }
}

function initCreeps() {
    for(var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];

        creep.hasNoEnergy = (creep.carry[RESOURCE_ENERGY] === 0);
        creep.hasEnergy = (creep.carry[RESOURCE_ENERGY] > 0);
        creep.hasFullEnergy = (creep.carry[RESOURCE_ENERGY] === creep.carryCapacity);
    }
}

function initRooms() {
    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];

        Game.recon.initRoomRecon(room);

        room.state = room.memory.state;

        room.mapPos = {
            'x': roomName.split(/[EWNS]+/)[1],
            'y': roomName.split(/[EWNS]+/)[2]
        };

        room.constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
        room.mostBuiltConstructionSite = room.constructionSites[0];

        for(var i = 0; i < room.constructionSites.length; i++) {
            var constructionSite = room.constructionSites[i];

            if(constructionSite.progress > room.mostBuiltConstructionSite.progress) {
                room.mostBuiltConstructionSite = constructionSite;
            }
        }

        if(room.controller !== undefined && room.controller.my) {
            if(room.energyAvailable < room.energyCapacityAvailable) {
                room.nonFullFactories = room.find(FIND_MY_STRUCTURES, {filter: function(s) { 
                    return (s.structureType === STRUCTURE_EXTENSION || s. structureType === STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
                }});
            }
            
            room.towers = room.find(FIND_MY_STRUCTURES, {filter: function(s) { return s.structureType === STRUCTURE_TOWER }});
            room.halfFullTowers = room.find(FIND_MY_STRUCTURES, {filter: function(s) { 
                return s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity/2 
            }});

            if(Game.flags['!HARVESTDEST|' + room.name] !== undefined) {
                var harvestDestFlag = Game.flags['!HARVESTDEST|' + room.name];
                room.memory['harvestDestination'] = {'x': harvestDestFlag.pos.x, 'y': harvestDestFlag.pos.y};
                harvestDestFlag.remove();
            }

            if(room.memory['harvestDestination'] !== undefined) {
                var destinationPos = new RoomPosition(room.memory['harvestDestination']['x'], room.memory['harvestDestination']['y'], room.name);
                
                if(destinationPos.structureExists(STRUCTURE_STORAGE)) room.harvestDestination = destinationPos.getStructure(STRUCTURE_STORAGE);
                if(destinationPos.structureExists(STRUCTURE_CONTAINER)) room.harvestDestination = destinationPos.getStructure(STRUCTURE_CONTAINER);
            }
        }

        room.enemies = room.find(FIND_CREEPS, {filter: function(c) { return c.isHostile(); }});
        room.friendlies = room.find(FIND_CREEPS, {filter: function(c) { return c.isFriendly(); }});
        room.damagedFriendlies = room.find(FIND_CREEPS, {filter: function(c) { return c.isFriendly() && c.hits < c.hitsMax; }});

        if(room.controller !== undefined && room.controller.my) {
            room.rampartsNeedingRepair = room.find(FIND_MY_STRUCTURES, {filter: function(s) { 
                return s.structureType === STRUCTURE_RAMPART && s.hits < DEFENSE_UPGRADE_SCHEDULE[s.room.controller.level.toString()]; 
            }});
    
            if(room.rampartsNeedingRepair.length > 0) {
                room.leastBuiltRampart = room.rampartsNeedingRepair[0];
        
                for(var i = 1 ; i < room.rampartsNeedingRepair.length; i++) {
                    var rampart = room.rampartsNeedingRepair[i];
                    if(rampart.hits < room.leastBuiltRampart.hits) {
                        room.leastBuiltRampart = rampart;
                    }
                }
            }
    
            room.wallsNeedingRepair = room.find(FIND_STRUCTURES, {filter: function(s) { 
                return s.structureType === STRUCTURE_WALL && s.hits < DEFENSE_UPGRADE_SCHEDULE[s.room.controller.level.toString()]; 
            }});
    
            if(room.wallsNeedingRepair.length > 0) {
                room.leastBuiltWall = room.wallsNeedingRepair[0];
        
                for(var i = 1 ; i < room.wallsNeedingRepair.length; i++) {
                    var wall = room.wallsNeedingRepair[i];
                    if(wall.hits < room.leastBuiltWall.hits) {
                        room.leastBuiltWall = wall;
                    }
                }
            }
        }

        room.hasSourceKeepers = room.find(FIND_HOSTILE_STRUCTURES, {filter: function(s) { return s.structureType === STRUCTURE_KEEPER_LAIR }}).length > 0;
    }
}