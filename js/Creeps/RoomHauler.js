const CreepProcess = require('CreepProcess');

class RoomHauler extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep != null) {
            this.targetRoom = Game.rooms[this.creep.memory.targetRoom];
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    updateStateTransitions() {
        var state = this.creep.memory.state;
        if(state == null) {
            state = 'pickupFromStorage';
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'pickupResource') {
            this.creep.getResourceFromStorage(this.targetRoom);
        }
    }
}

module.exports = RoomHauler;