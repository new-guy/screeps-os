const CreepProcess = require('CreepProcess');

class Upgrader extends CreepProcess {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    performStateActions() {
        var targetRoom = Game.rooms[this.creep.memory.targetRoom];
        this.creep.upgradeThisController(targetRoom.controller);
    }
}

module.exports = Upgrader;