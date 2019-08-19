const CreepProcess = require('CreepProcess');

class Builder extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.targetRoom = Game.rooms[this.creep.memory.targetRoom];
        }
    }

    updateStateTransitions() {
        var state = this.creep.memory.state;
        if(state == undefined) {
            state = 'getEnergy';
        }

        if(state === 'getEnergy') {
            if(this.creep.hasFullEnergy) {
                state = 'work'
                this.creep.clearTarget();
            }
        }

        else if(state === 'work') {
            if(this.creep.hasNoEnergy) {
                state = 'getEnergy'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'getEnergy') {
            this.creep.getEnergyFromStorage(this.targetRoom);
        }

        else if(state === 'work') {
            this.work();
        }
    }

    work() {
        if(this.targetRoom === undefined) {
            this.creep.moveTo(new RoomPosition(24, 24, this.creep.memory.targetRoom));
            this.creep.say('NoVision');
            return;
        }

        var target = this.creep.getTarget();

        if(target === null) {
            this.determineTarget();
            target = this.creep.getTarget();
        }

        //Need to get target.  If we have no target, we need to determine a target
        //Do work based upon the target's class

        if(target instanceof ConstructionSite) {
            this.creep.buildTarget();
        }

        else {
            this.creep.repairTarget();
            //Repair target
        }
    }

    determineTarget() {
        //If the room is below energy capacity, find the closest spawn or extension
        //If there are any roads below 50%, repair them
        //If the room has any construction sites, build them

        if(this.targetRoom.constructionSites !== undefined && this.targetRoom.constructionSites.length > 0) {
            this.creep.setTarget(this.targetRoom.mostBuiltConstructionSite);
        }

        else if(this.targetRoom.rampartsNeedingRepair !== undefined && this.targetRoom.rampartsNeedingRepair.length > 0) {
            this.creep.setTarget(this.targetRoom.leastBuiltRampart);
        }
    }
}

module.exports = Builder;