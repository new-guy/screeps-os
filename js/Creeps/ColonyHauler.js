const CreepProcess = require('CreepProcess');

class ColonyHauler extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '🚚'

        if(this.creep != null) {
            this.sourceRoom = Game.rooms[this.creep.memory.sourceRoom];
            this.sinkRoom = Game.rooms[this.creep.memory.sinkRoom];
            this.resourceType = this.creep.memory.resource;
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    updateStateTransitions() {
        var state = 'haul';
        this.creep.memory.state = state;
    }

    performStateActions() {
        var source = this.sourceRoom.harvestDestination;
        var sink = this.sinkRoom.harvestDestination;
        this.creep.haulResourceFromSourceToSink(this.resourceType, source, sink);
    }
}

module.exports = ColonyHauler;