//Load non-process info
//Initialize the scheduler.  Load PID metadata from memory & sort it
//Run main scheduler loop
require('constants');

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
                    'homeRoomName': roomName
                }
            }
        }
    }
}

function initGameColonies() {
    Game.colonies = {};

    for(var roomName in Memory.colonies) {
        Game.colonies[roomName] = new Colony(Memory.colonies[roomName]);
    }
}