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

const Scheduler = require('Scheduler');
const Colony = require('Colony');

const RAMPART_UPGRADE_SCHEDULE = {
    "1": 5000,
    "2": 5000,
    "3": 20000,
    "4": 50000,
    "5": 150000,
    "6": 500000,
    "7": 1500000,
    "8": 25000000,
};

module.exports.loop = function() {
    initCustomObjects();

    const scheduler = new Scheduler();
    scheduler.update();
    scheduler.garbageCollect();
}

function initCustomObjects() {
    initScouting();
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

        room.mapPos = {
            'x': roomName.split(/[EWNS]+/)[1],
            'y': roomName.split(/[EWNS]+/)[2]
        };

        if(room.controller !== undefined && room.controller.my) {
            if(room.energyAvailable < room.energyCapacityAvailable) {
                room.nonFullFactories = room.find(FIND_MY_STRUCTURES, {filter: function(s) { 
                    return (s.structureType === STRUCTURE_EXTENSION || s. structureType === STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
                }});
            }

            room.constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
            room.mostBuiltConstructionSite = room.constructionSites[0];

            for(var i = 0; i < room.constructionSites.length; i++) {
                var constructionSite = room.constructionSites[i];

                if(constructionSite.progress > room.mostBuiltConstructionSite.progress) {
                    room.mostBuiltConstructionSite = constructionSite;
                }
            }
            
            room.towers = room.find(FIND_MY_STRUCTURES, {filter: function(s) { return s.structureType === STRUCTURE_TOWER }});
            room.halfFullTowers = room.find(FIND_MY_STRUCTURES, {filter: function(s) { 
                return s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity/2 
            }});
        }

        room.enemies = room.find(FIND_CREEPS, {filter: function(c) { return c.isHostile(); }});
        room.friendlies = room.find(FIND_CREEPS, {filter: function(c) { return c.isFriendly(); }});
        room.damagedFriendlies = room.find(FIND_CREEPS, {filter: function(c) { return c.isFriendly() && c.hits < c.hitsMax; }});
        room.damagedRoads = room.find(FIND_STRUCTURES, {filter: function(s) { return s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax; }});
        room.rampartsNeedingRepair = room.find(FIND_MY_STRUCTURES, {filter: function(s) { 
            return s.structureType === STRUCTURE_RAMPART && s.hits < RAMPART_UPGRADE_SCHEDULE[s.room.controller.level.toString()]; 
        }});
    }
}