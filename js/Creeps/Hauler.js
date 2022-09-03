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
        var state = this.creep.memory.state;
        if(state == null) {
            state = 'pickupEnergy';
        }

        if(state === 'pickupEnergy') {
            if(this.creep.store.getFreeCapacity() === 0) {
                state = 'dropoffEnergy'
                this.creep.clearTarget();
            }
        }

        else if(state === 'dropoffEnergy') {
            if(this.creep.store.getUsedCapacity() === 0) {
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
            if(this.targetHarvestDestination == null) {
                var targetRoom = Game.rooms[this.creep.memory['targetStorageRoom']];
                var targetColony = Game.colonies[targetRoom.memory.colonyName];
                this.creep.setTarget(targetColony.getClosestHarvestDestination(this.creep.pos))
            }
            else {
                this.creep.setTarget(this.targetHarvestDestination);
            }
            this.creep.putResourceInTarget();
        }
    }

    pickupFromContainer() {
        if(this.container == null) {
            this.creep.moveTo(this.containerPos);
        }

        else if(this.container == null && this.creep.pos.getRangeTo(this.containerPos) > 4) {
            this.creep.moveTo(this.containerPos);
        }

        else {
            if(this.creep.pos.getRangeTo(this.container) > 1) {
                this.creep.moveTo(this.container);
            }

            else if(this.container.store.getUsedCapacity() >= this.creep.store.getCapacity()) {
                this.creep.withdraw(this.container, this.resourceType);
            }
        }
    }
}

module.exports = Hauler;