const Process = require('Process');

class HomeRoomConstructionMonitor extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.room.updateConstructionSites();
    }

    processShouldDie() {
        return false;
    }
}

module.exports = HomeRoomConstructionMonitor;