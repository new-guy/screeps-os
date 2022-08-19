const CreepProcess = require('CreepProcess');

class ColonyBuilder extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep != null) {
            this.targetColony = Game.colonies[this.creep.memory.targetColony];
        }
    }

    updateStateTransitions() {
        var state = this.creep.memory.state;
        if(state == null) {
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
            this.creep.getEnergyFromClosestColonyHarvestDestination(this.spawningColony, true);
        }

        else if(state === 'work') {
            this.work();
        }
    }

    work() {
        var target = this.creep.getTarget();

        if(target == null) {
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
        // - Go to room that needs critical repairs
        // - Build/repair in current room
        // - Build in room that most needs construction

        var targetRoom = this.getTargetRoom();

        if(targetRoom == null) {
            this.creep.say('NoRoom');
        }

        else {
            this.creep.say(targetRoom.name);
            if(targetRoom.constructionSites != null && targetRoom.constructionSites.length > 0) {
                this.creep.setTarget(targetRoom.getMostBuiltConstructionSite());
            }
    
            else if(targetRoom.rampartsNeedingRepair != null && targetRoom.rampartsNeedingRepair.length > 0 ||
                    targetRoom.wallsNeedingRepair != null && targetRoom.wallsNeedingRepair.length > 0) {
                
                var thingToRepair = _.sample(targetRoom.rampartsNeedingRepair);
    
                if(targetRoom.leastBuiltRampart == null || (targetRoom.leastBuiltWall != null && targetRoom.leastBuiltWall.hits < targetRoom.leastBuiltRampart.hits)) {
                    thingToRepair = _.sample(targetRoom.wallsNeedingRepair);
                }
    
                this.creep.setTarget(thingToRepair);
            }
        }
    }

    getTargetRoom() {
        if(this.creep.room.constructionSites.length > 0 || this.creep.room.rampartsNeedingRepair != null && this.creep.room.rampartsNeedingRepair.length > 0) {
            return this.creep.room;
        }

        else {
            return this.targetColony.roomMostNeedingBuilder;
        }
    }
}

module.exports = ColonyBuilder;