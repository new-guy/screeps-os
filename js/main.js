//Load non-process info
//Initialize the scheduler.  Load PID metadata from memory & sort it
//Run main scheduler loop
require('constants');

//Creep abilities
require('Targets');
require('Mining');
require('GenericCreepAbilities');
require('Upgrading');

//Room functions
require('HomeRoomConstructionTools');
require('RoomTools');

//RoomPosition
require('RoomPositionTools');

const Scheduler = require('Scheduler');
const Colony = require('Colony');

module.exports.loop = function() {
    initCustomObjects();

    const scheduler = new Scheduler();
    scheduler.update();
    scheduler.garbageCollect();
}

function initCustomObjects() {
    initColonies();
    initCreeps();
    initRooms();
}

function initColonies() {
    initColonyMemory();
    initNewColonies();
    initGameColonies();
}

function initColonyMemory() {
    if(Memory.colonies === undefined) {
        Memory.colonies = {};
    }
}

function initNewColonies() {
    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];

        if(room.controller !== undefined && room.controller.my && room.controller.level > 0) {
            if(Memory.colonies[roomName] === undefined) {
                Memory.colonies[roomName] = {
                    'name': roomName,
                    'homeRoomName': roomName
                }
            }
        }
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
        }
    }
}