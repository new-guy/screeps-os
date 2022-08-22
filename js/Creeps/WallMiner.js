const CreepProcess = require('CreepProcess');

class WallMiner extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep != null) {
            this.targetFlag = Game.flags[this.creep.memory['targetFlag']]
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
            state = 'wallMine';
        }

        if(state === 'wallMine') {
            if(this.creep.hasFullEnergy) {
                state = 'dropoffEnergy'
                this.creep.clearTarget();
            }
        }

        else if(state === 'dropoffEnergy') {
            if(this.creep.hasNoEnergy) {
                state = 'wallMine'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'wallMine') {
            this.mineFromNearestWall();
        }

        else if(state === 'dropoffEnergy') {
            var targetHarvestDestination = this.spawningColony.getClosestHarvestDestination(this.creep.pos);
            this.creep.setTarget(targetHarvestDestination);
            this.creep.putEnergyInTarget();
        }
    }

    mineFromNearestWall() {
        if(this.creep.room.name !== this.targetFlag.pos.roomName) {
            this.creep.moveTo(this.targetFlag);
        }
        else if(!this.creep.hasTarget()) {
            var target = this.findNearestWall();
            this.creep.moveTo(this.targetFlag);
            if(target == null) {
                this.creep.say('NoWall');
                return;
            }
            else {
                this.creep.setTarget(target);
            }
        }
        else {
            var target = this.creep.getTarget();
            if(this.creep.pos.isNearTo(target)) {
                this.creep.dismantle(target);
            }
            else {
                this.creep.moveTo(target);
            }
        }
    }

    findNearestWall() {
        var walls = this.creep.room.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_WALL }});

        return this.creep.pos.findClosestByPath(walls);
    }
}

module.exports = WallMiner;