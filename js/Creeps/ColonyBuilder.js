const CreepProcess = require('CreepProcess');

class ColonyBuilder extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.targetColony = Game.colonies[this.creep.memory.targetColony];
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
            this.creep.getEnergyFromClosestColonyStorage(this.spawningColony);
        }

        else if(state === 'work') {
            this.work();
        }
    }

    work() {
        if(this.targetColony === undefined) {
            this.creep.moveTo(new RoomPosition(24, 24, this.creep.memory.targetColony));
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
        // - Go to room that needs critical repairs
        // - Build/repair in current room
        // - Build in room that most needs construction

        var targetRoom = this.getTargetRoom();

        if(targetRoom === undefined) {
            this.creep.say('NoRoom');
        }

        else {
            if(targetRoom.constructionSites !== undefined && targetRoom.constructionSites.length > 0) {
                this.creep.setTarget(targetRoom.mostBuiltConstructionSite);
            }
    
            else if(targetRoom.rampartsNeedingRepair !== undefined && targetRoom.rampartsNeedingRepair.length > 0 ||
                    targetRoom.wallsNeedingRepair !== undefined && targetRoom.wallsNeedingRepair.length > 0) {
                
                var thingToRepair = targetRoom.leastBuiltRampart;
    
                if(targetRoom.leastBuiltRampart === undefined || (targetRoom.leastBuiltWall !== undefined && targetRoom.leastBuiltWall.hits < targetRoom.leastBuiltRampart.hits)) {
                    thingToRepair = targetRoom.leastBuiltWall;
                }
    
                this.creep.setTarget(thingToRepair);
            }
        }
    }

    getTargetRoom() {

        //Check if a room needs critical repairs
        //Check if this room has construction sites
        //Otherwise just set targetRoom to the colony's most needed
        if(this.targetColony.roomNeedingCriticalRepairs !== undefined) {
            return this.targetColony.roomNeedingCriticalRepairs;
        }

        else if(this.creep.room.constructionSites.length > 0) {
            return this.creep.room;
        }

        else {
            return this.targetColony.roomMostNeedingBuilder;
        }
    }
}

module.exports = ColonyBuilder;