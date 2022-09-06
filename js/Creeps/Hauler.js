const CreepProcess = require('CreepProcess');

class Hauler extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '🚛'

        if(this.creep != null) {
            this.targetHarvestDestination = Game.rooms[this.creep.memory['targetStorageRoom']].harvestDestination;
            this.containerPos = new RoomPosition(this.creep.memory['containerPos']['x'], this.creep.memory['containerPos']['y'], this.creep.memory['containerPos']['roomName'])

            if(Game.rooms[this.containerPos.roomName] != null) {
                this.container = this.containerPos.getStructure(STRUCTURE_CONTAINER);
            }

            if(this.creep.memory.mineralType != null) {
                this.mode = 'mineral'
                this.resourceType = this.creep.memory.mineralType;
            }
            else {
                this.mode = 'energy'
                this.resourceType = RESOURCE_ENERGY;
            }
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
        var state = this.creep.memory.state;
        if(state === 'haul') {
            this.haul();
        }
    }

    haul() {
        if(this.container == null && this.creep.pos.getRangeTo(this.containerPos) > 2) {
            this.creep.moveTo(this.containerPos);
        }

        else {
            this.creep.haulResourceFromSourceToSink(this.resourceType, this.container, this.targetHarvestDestination);
        }
    }
}

module.exports = Hauler;