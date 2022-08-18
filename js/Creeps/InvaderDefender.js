const CreepProcess = require('CreepProcess');

class InvaderDefender extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep != null) {
            this.targetColony = Game.colonies[this.creep.memory.targetColony];
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
            state = 'relocating';
        }

        if(state === 'relocating') {
            if(this.creep.room.enemies != null && this.creep.room.enemies.length > 0) {
                state = 'fighting'
                this.creep.clearTarget();
            }
        }

        else if(state === 'fighting') {
            if(this.creep.room.enemies == null || this.creep.room.enemies.length === 0) {
                state = 'relocating'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'relocating') {
            this.relocate();
        }

        else if(state === 'fighting') {
            this.fight();
        }
    }

    relocate() {
        var roomToDefend = this.targetColony.invadedRoomToDefend;
        if(roomToDefend == null) {
            this.creep.say('Guarding');
            if(this.creep.room.name !== this.targetColony.primaryRoom.name) {
                var primaryRoom = new RoomPosition(25, 25, this.targetColony.primaryRoom.name);
        
                this.creep.moveTo(primaryRoom);
            }
            return;
        }
        var middleRoomPosition = new RoomPosition(25, 25, roomToDefend.name);

        this.creep.moveTo(middleRoomPosition);
    }

    fight() {
        var enemies = this.creep.room.enemies;
        var target = this.creep.pos.findClosestByPath(enemies);

        var rangeToTarget = this.creep.pos.getRangeTo(target);

        if(rangeToTarget > 3) this.creep.moveTo(target);
        else if(rangeToTarget < 3) {
            var fleePath = PathFinder.search(this.creep.pos, target, {flee: true}).path;
            this.creep.moveByPath(fleePath);
            this.creep.say('Flee');
        }

        if(rangeToTarget <= 3) {
            this.creep.rangedAttack(target);
        }
    }
}

module.exports = InvaderDefender;