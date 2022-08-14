const CreepProcess = require('CreepProcess');

class Hauler extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.targetHarvestDestination = Game.rooms[this.creep.memory['targetStorageRoom']].harvestDestination;
            this.containerPos = new RoomPosition(this.creep.memory['containerPos']['x'], this.creep.memory['containerPos']['y'], this.creep.memory['containerPos']['roomName'])

            if(Game.rooms[this.containerPos.roomName] !== undefined) {
                this.container = this.containerPos.getStructure(STRUCTURE_CONTAINER);
            }
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    updateStateTransitions() {
        var state = this.creep.memory.state;
        if(state == undefined) {
            state = 'pickupEnergy';
        }

        if(state === 'pickupEnergy') {
            if(this.creep.hasFullEnergy) {
                state = 'dropoffEnergy'
                this.creep.clearTarget();
            }
        }

        else if(state === 'dropoffEnergy') {
            if(this.creep.hasNoEnergy) {
                state = 'pickupEnergy'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'pickupEnergy') {
            this.pickupFromContainer();
        }

        else if(state === 'dropoffEnergy') {
            this.creep.setTarget(this.targetHarvestDestination);
            this.creep.putEnergyInTarget();
        }
    }

    pickupFromContainer() {
        if(this.container === undefined) {
            this.creep.moveTo(this.containerPos);
        }

        else if(this.container === null && this.creep.pos.getRangeTo(this.containerPos) > 4) {
            this.creep.moveTo(this.containerPos);
        }

        else {
            if(this.creep.pos.getRangeTo(this.container) > 1) {
                this.creep.moveTo(this.container);
            }

            else {
                this.creep.withdraw(this.container, RESOURCE_ENERGY);
            }
        }
    }
}

module.exports = Hauler;