const CreepProcess = require('CreepProcess');

class UpgradeFeeder extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
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
        if(state == undefined) {
            state = 'pickupEnergy';
        }

        if(state === 'pickupEnergy') {
            if(this.creep.hasFullEnergy) {
                state = 'feedUpgraders'
                this.creep.clearTarget();
            }
        }

        else if(state === 'feedUpgraders') {
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
            this.creep.getEnergyFromHarvestDestination(this.targetRoom);
        }

        else if(state === 'feedUpgraders') {
            if(this.creep.getTarget() === null) {
                this.findUpgraderToFeed();
            }

            if(this.creep.getTarget() !== null) {
                this.creep.putEnergyInTarget();
            }

            else if(this.creep.pos.getRangeTo(this.targetRoom.controller) > 5){
                this.creep.moveTo(this.targetRoom.controller);
            }
        }
    }

    findUpgraderToFeed() {
        var nonFullUpgraders = [];

        for(var i = 0; i < this.targetRoom.friendlies.length; i++) {
            var friendly = this.targetRoom.friendlies[i];
            var friendlyNeedsEnergy = (friendly.carry[RESOURCE_ENERGY] === undefined || friendly.carry[RESOURCE_ENERGY] < friendly.carryCapacity/2);

            if(friendly.memory.creepProcessClass === 'Upgrader' && friendlyNeedsEnergy) {
                nonFullUpgraders.push(friendly);
            }
        }

        var closestNonFullUpgrader = this.creep.pos.findClosestByRange(nonFullUpgraders);
        if(closestNonFullUpgrader === null) return;

        console.log(closestNonFullUpgrader.memory.creepProcessClass);
        console.log(closestNonFullUpgrader.carry[RESOURCE_ENERGY]);
        this.creep.setTarget(closestNonFullUpgrader);
        console.log(this.creep.getTarget());
    }
}

module.exports = UpgradeFeeder;