const Process = require('Process');

class LinkManager extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        //Need to spawn link fillers
        //Need to update links
    }

    processShouldDie() {
        return false;
    }
}

module.exports = LinkManager;

