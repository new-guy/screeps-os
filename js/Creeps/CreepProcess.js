const Process = require('Process');

class CreepProcess extends Process {
    constructor (...args) {
        super(...args);

        this.creep = Game.creeps[this.memory.creepName];

        if(this.creep !== undefined) {
            this.spawningColony = Game.colonies[this.creep.memory.spawningColonyName];
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.creep === undefined) {
            console.log(this.memory.creepName + ' is not defined');
        }

        else if(this.creep !== undefined && this.creep.spawning) {
            console.log(this.creep.name + ' is spawning');
        }

        else {
            this.updateStateTransitions();
            this.performStateActions();
        }
    }

    updateStateTransitions() {
        if(this.creep !== undefined) {
            this.creep.say('nostates');
        }
    }

    performStateActions() {

    }

    processShouldDie() {
        var myCreepExists = (this.creep !== undefined);

        var shouldDie = !myCreepExists;
        if(shouldDie) {
            console.log('Killing process ' + this.pid + ' because creep does not exist');
        }

        return shouldDie;
    }
}

module.exports = CreepProcess;