const CreepProcess = require('CreepProcess');

class TowerFiller extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '🏰';

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
        var state = 'fillTowers';
        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'fillTowers') {
            var target = this.findTowerToFill();
            if(target != null) {
                this.creep.haulResourceFromSourceToSink(RESOURCE_ENERGY, this.targetRoom.harvestDestination, target);
            }

            else {
                var heartFlag = Game.flags['!CHUNK|heart|' + this.targetRoom.name];
                var waitingSpot = new RoomPosition(heartFlag.pos.x-1, heartFlag.pos.y, heartFlag.room.name);
                if(this.creep.pos.getRangeTo(waitingSpot) != 0) {
                    this.creep.moveTo(waitingSpot);
                }
            }
        }
    }

    findTowerToFill() {
        if(this.targetRoom.halfFullTowers != null && this.targetRoom.halfFullTowers.length > 0) {
            var closestTower = this.creep.pos.findClosestByPath(this.targetRoom.halfFullTowers);

            if(closestTower != null) {
                this.creep.setTarget(closestTower)
            }
            else {
                console.log("Error finding half full tower for " + this.creep.name);
            }
        }
    }
}

module.exports = TowerFiller;