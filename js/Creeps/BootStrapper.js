const CreepProcess = require('CreepProcess');

class BootStrapper extends CreepProcess {
    constructor (...args) {
        super(...args);
    }

    updateStateTransitions() {
        var state = this.creep.memory.state;
        if(state == undefined) {
            state = 'mineEnergy';
        }

        if(state === 'mineEnergy') {
            if(this.creep.hasFullEnergy) {
                state = 'work'
            }
        }

        else if(state === 'work') {
            if(this.creep.hasNoEnergy) {
                state = 'mineEnergy'
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'mineEnergy') {
            this.mineEnergy();
        }

        else if(state === 'work') {
            this.work();
        }
    }

    mineEnergy() {
        if(this.creep.hasTargetOfClass(Source)) {
            this.creep.say('HasSrc');

            var targetSource = this.creep.getTarget();

            this.creep.harvestFrom(targetSource);
        }

        else {
            if(this.creep.hasTarget()) {
                this.creep.clearTarget();
            }

            var activeSources = this.spawningColony.activeSources;

            var nearestSource = this.creep.pos.findClosestByPath(activeSources);

            if(nearestSource !== null) {
                this.creep.setTarget(nearestSource);
            }

            else {
                this.creep.say('NoSrc');
            }
        }
    }

    work() {
        var targetRoom = Game.rooms[this.creep.memory.targetRoom];

        if(targetRoom === undefined) {
            this.creep.moveTo(new RoomPosition(24, 24, this.creep.targetRoom));
        }

        else if(targetRoom.controller !== undefined && (targetRoom.controller.needsSaving() || this.creep.memory.savingRoom === true))
        {
            this.creep.say("SaveCont");
            this.creep.upgradeThisController(targetRoom.controller);
        }

        else {
            this.creep.say('Upgrade');
            this.creep.upgradeThisController(targetRoom.controller);
        }
    }
}

module.exports = BootStrapper;