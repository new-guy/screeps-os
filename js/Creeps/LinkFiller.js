const CreepProcess = require('CreepProcess');

class LinkFiller extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.room = Game.rooms(this.creep.memory['roomName']);
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
                state = 'fillLink'
                this.creep.clearTarget();
            }
        }

        else if(state === 'fillLink') {
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
            this.creep.getEnergyFromClosestColonyStorage(this.spawnColony);
        }

        else if(state === 'fillLink') {
            this.fillLinks();
        }
    }

    fillLinks() {
        var linkToFill = Game.getObjectById(this.creep.memory.linkToFillId);
    
        if(linkToFill == null) {
            console.log(this.creep.name + " has no link to fill");
        }
    
        else {
            if(this.creep.pos.getRangeTo(linkToFill) === 1 && linkToFill.energy < linkToFill.energyCapacity) {
                this.creep.transfer(linkToFill, RESOURCE_ENERGY);
            }
    
            else {
                this.creep.moveTo(linkToFill);
            }
        }
    }
}

module.exports = LinkFiller;