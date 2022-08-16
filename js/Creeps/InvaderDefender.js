const CreepProcess = require('CreepProcess');

class InvaderDefender extends CreepProcess {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    updateStateTransitions() {
        //Relocating
            //If this.creep.room.enemies === undefined, find the best room to go to
            //Else, fighting
        //Fighting
            //Transition out of it if this.creep.room.enemies === undefined

        var state = this.creep.memory.state;
        if(state == undefined) {
            state = 'relocating';
        }

        if(state === 'relocating') {
            if(this.creep.room.enemies !== undefined) {
                state = 'fighting'
                this.creep.clearTarget();
            }
        }

        else if(state === 'fighting') {
            if(this.creep.hasNoEnergy) {
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
}

module.exports = InvaderDefender;