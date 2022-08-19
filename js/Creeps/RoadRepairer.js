const CreepProcess = require('CreepProcess');

class RoadRepairer extends CreepProcess {
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

        this.creep.repairTarget();
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
            if(targetRoom.mostDamagedRoad != null) {
                this.creep.setTarget(targetRoom.mostDamagedRoad);
            }
        }
    }

    getTargetRoom() {
        if(this.creep.room.mostDamagedRoad != null) {
            return this.creep.room;
        }

        if(this.targetColony.roomNeedingRoadRepairs != null) {
            return this.targetColony.roomNeedingRoadRepairs;
        }
    }
}

module.exports = RoadRepairer;