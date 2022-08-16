const Process = require('Process');

class InvaderMonitor extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
        for(var i = 0; i < this.colony.colonyRoomInfo.length; i++) {
            
        }
        console.log('printing stuff about this process');
    }

    someOtherFunction() {
        return (this.stuff.controller.level < 5 && this.stuff.storage === undefined);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = InvaderMonitor;