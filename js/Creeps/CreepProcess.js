const Process = require('Process');

class CreepProcess extends Process {
    constructor (...args) {
        super(...args);

        this.creep = Game.creeps[this.memory.creepName];
        this.spawningColony = Game.colonies[this.creep.memory.spawningColonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.creep.spawning) {
            console.log(this.creep.name + ' is spawning');
        }

        else {
            this.updateStateTransitions();
            this.performStateActions();
        }
    }

    updateStateTransitions() {
        this.creep.say('nostates');
    }

    performStateActions() {

    }

    processShouldDie() {
        var myCreepExists = (this.creep !== undefined);

        if(!myCreepExists) {
            console.log('Killing process ' + this.pid + ' because creep does not exist');
        }

        return !myCreepExists;
    }
}

module.exports = CreepProcess;