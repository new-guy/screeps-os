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
        if(state == null) {
            state = 'relocating';
        }

        var hasInvadersToFight = (this.creep.room.hasInvaders() || this.creep.room.hasInvaderStructures() || this.creep.room.enemies.length > 0);

        if(state === 'relocating') {
            if(hasInvadersToFight) {
                state = 'fighting'
                this.creep.clearTarget();
            }
        }

        else if(state === 'fighting') {
            if(!hasInvadersToFight) {
                state = 'relocating'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'relocating') {
            this.creep.say('🚶');
            this.relocate();
        }

        else if(state === 'fighting') {
            this.fight();
        }
    }

    relocate() {
        var roomToDefend = this.targetColony.invadedRoomToDefend;
        if(roomToDefend == null) {
            this.creep.say('🛡️');
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
        var target = this.determineTarget();
        var rangeToTarget = this.creep.pos.getRangeTo(target);

        if(this.creep.pos.isEdge()) {
            this.creep.say('🤠');
            this.creep.moveTo(target);
        }
        else if(rangeToTarget > 3) {
            this.creep.say('🤠');
            this.creep.moveTo(target);
        }
        else if(rangeToTarget < 3) {
            var fleePath = PathFinder.search(this.creep.pos, {pos: target.pos, range: 4}, {flee: true});
            this.creep.moveByPath(fleePath.path);
            this.creep.say('😱');
        }

        if(rangeToTarget <= 3) {
            this.creep.rangedAttack(target);
            this.creep.say('🔫');
        }
    }

    determineTarget() {
        var targetArray = [];

        if(this.creep.room.hasInvaders()) {
            targetArray = targetArray.concat(this.creep.room.enemies);
        }
        else if(this.creep.room.enemies.length > 0) {
            targetArray = this.creep.room.enemies;
        }
        else if(this.creep.room.hasInvaderStructures()) {
            targetArray = this.creep.room.getInvaderStructures();
        }

        if(targetArray.length === 0) return null;
        var target = this.creep.pos.findClosestByPath(targetArray);

        return target;
    }
}

module.exports = InvaderDefender;