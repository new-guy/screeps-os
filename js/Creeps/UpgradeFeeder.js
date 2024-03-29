const CreepProcess = require('CreepProcess');

class UpgradeFeeder extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '🛺';

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
        var state = 'feedUpgraders';
        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'feedUpgraders') {
            if(this.creep.getTarget() == null || this.creep.getTarget().hasFullEnergy) {
                this.findUpgraderToFeed();
            }

            if(this.creep.getTarget() != null) {
                this.creep.haulResourceFromSourceToSink(RESOURCE_ENERGY, this.targetRoom.harvestDestination, this.creep.getTarget(), {haulUntilEmpty: true});
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
            var friendlyNeedsEnergy = (friendly.carry[RESOURCE_ENERGY] == null || friendly.carry[RESOURCE_ENERGY] < friendly.carryCapacity/2);

            if(friendly.memory.creepProcessClass === 'Upgrader' && friendlyNeedsEnergy) {
                nonFullUpgraders.push(friendly);
            }
        }

        var closestNonFullUpgrader = this.creep.pos.findClosestByRange(nonFullUpgraders);
        if(closestNonFullUpgrader == null) return;

        this.creep.setTarget(closestNonFullUpgrader);
    }
}

module.exports = UpgradeFeeder;