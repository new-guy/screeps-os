const CreepProcess = require('CreepProcess');

class TowerFiller extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.targetRoom = Game.rooms[this.creep.memory.targetRoom];
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
            state = 'pickupEnergy';
        }

        if(state === 'pickupEnergy') {
            if(this.creep.hasFullEnergy) {
                state = 'fillTowers'
                this.creep.clearTarget();
            }
        }

        else if(state === 'fillTowers') {
            if(this.creep.hasNoEnergy) {
                state = 'pickupEnergy'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'pickupEnergy') {
            this.creep.getEnergyFromStorage(this.targetRoom);
        }

        else if(state === 'fillTowers') {
            if(this.creep.getTarget() === null) {
                this.findTowerToFill();
            }

            if(this.creep.getTarget() !== null) {
                this.creep.putEnergyInTarget();
            }

            else {
                if(this.creep.pos.getRangeTo(this.targetRoom.controller) > 5) {
                    this.creep.moveTo(this.targetRoom.controller);
                }
            }
        }
    }

    findTowerToFill() {
        if(this.targetRoom.halfFullTowers !== undefined && this.targetRoom.halfFullTowers.length > 0) {
            var closestTower = this.creep.pos.findClosestByPath(this.targetRoom.halfFullTowers);

            if(closestTower !== null) {
                this.creep.setTarget(closestTower)
            }
            else {
                console.log("Error finding half full tower for " + this.creep.name);
            }
        }
    }
}

module.exports = TowerFiller;