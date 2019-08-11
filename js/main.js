//Load non-process info
//Initialize the scheduler.  Load PID metadata from memory & sort it
//Run main scheduler loop
require('constants');

const Scheduler = require('Scheduler');

module.exports.loop = function() {
    initCustomObjects();

    const scheduler = new Scheduler();
    scheduler.update();
}

function initCustomObjects() {
    Game.empire = {
        "colonies": getEmpireColonies()
    };
}

function getEmpireColonies() {
    var empireColonies = {};

    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];

        if(room.controller !== undefined && room.controller.my && room.controller.level > 0) {
            empireColonies[roomName] = room;
        }
    }

    return empireColonies;
}