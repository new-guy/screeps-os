const CreepProcess = require('CreepProcess');

class RoomHauler extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '🚜';

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
            state = 'terminalFilling';
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'terminalFilling') {
            var resourceToHaul = this.targetRoom.getResourceTypeToHaulFromStorageToTerminal();
            if(resourceToHaul == null) {
                return;
            }
            else {
                var storage = this.targetRoom.storage;
                var terminal = this.targetRoom.terminal;
                var delta = this.targetRoom.getResourceSourceSinkDelta(resourceToHaul, storage, terminal);

                this.creep.say(resourceToHaul)

                this.creep.haulResourceFromSourceToSink(resourceToHaul, storage, terminal, {amount: delta});
            }
        }
    }
}

module.exports = RoomHauler;