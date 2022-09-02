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
        var state = this.creep.memory.state;
        if(state == null) {
            state = 'pickupResource';
        }

        if(state === 'pickupResource') {
            if(this.creep.hasFullEnergy) {
                state = 'dropoffResource'
                this.creep.clearTarget();
            }
        }

        else if(state === 'dropoffResource') {
            if(this.creep.hasNoEnergy) {
                state = 'pickupResource'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        if(this.resourceType !== RESOURCE_ENERGY) this.creep.say('NoSupport')

        var state = this.creep.memory.state;
        if(state === 'pickupResource') {
            this.creep.getEnergyFromHarvestDestination(this.sourceRoom);
        }

        else if(state === 'dropoffResource') {
            this.creep.putEnergyInHarvestDestination(this.sinkRoom)
        }
    }
}

module.exports = ColonyHauler;