const CreepProcess = require('CreepProcess');

class WallMiner extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '👷';

        if(this.creep != null) {
            this.targetRoom = Game.rooms[this.creep.memory['targetRoom']]
        }
    }

    update() {
        if(this.targetRoom == null) return;
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
            this.creep.putResourceInTarget();
        }
    }

    mineFromNearestWall() {
        var roomMiddle = new RoomPosition(24, 24, this.targetRoom.name);
        if(this.creep.room.name !== this.targetRoom.name) {
            this.creep.moveTo(roomMiddle);
        }
        else if(!this.creep.hasTarget()) {
            var target = this.findNearestWall();
            this.creep.moveTo(roomMiddle);
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