const CreepProcess = require('CreepProcess');

class ColonyBuilder extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '🔨'

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
            var waited = this.creep.memory['waited'];
            if((waited == null || waited == 0) && this.creep.store.getFreeCapacity() > 0 && this.creep.store.getUsedCapacity() > 0) {
                this.sleep(2);
                this.creep.memory['waited'] = 1;
                this.creep.say('Wait');
                //In this scenario there's a chance it means that the creep just finished building and still has energy
                //We sleep for 3 ticks here to give the building computer time to add a site
                return;
            }
            else {
                this.determineTarget();
                target = this.creep.getTarget();
                this.creep.memory['waited'] = 0;
            }
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

        if(targetRoom != null) {
            this.creep.say(targetRoom.name);
            if(targetRoom.constructionSites != null && targetRoom.constructionSites.length > 0) {
                this.creep.setTarget(targetRoom.getMostBuiltConstructionSite());
            }
    
            else if(targetRoom.rampartsNeedingRepair != null && targetRoom.rampartsNeedingRepair.length > 0) {
                
                var thingToRepair = _.sample(targetRoom.rampartsNeedingRepair);
    
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