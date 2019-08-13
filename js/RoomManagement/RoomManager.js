const Process = require('Process');

class RoomManager extends Process {
    constructor (...args) {
        super(...args);

        this.name = this.memory.roomName;
        this.room = Game.rooms[this.name];
    }
}

module.exports = RoomManager;