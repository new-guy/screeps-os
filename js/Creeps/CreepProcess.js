const Process = require('Process');

class CreepProcess extends Process {
    constructor (...args) {
        super(...args);

        this.creep = Game.creeps[this.memory.creepName];

        if(this.creep != null) {
            this.spawningColony = Game.colonies[this.creep.memory.spawningColonyName];
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.creep == null) {
            console.log(this.memory.creepName + ' is not defined');
        }

        else if(this.creep != null && this.creep.spawning) {
            console.log(this.creep.name + ' is spawning');
        }

        else {
            this.updateStateTransitions();
            this.performStateActions();
        }
    }

    updateStateTransitions() {
    }

    performStateActions() {

    }

    processShouldDie() {
        var myCreepExists = (this.creep != null);

        var shouldDie = !myCreepExists;
        if(shouldDie) {
            console.log('Killing process ' + this.pid + ' because creep does not exist');
        }

        return shouldDie;
    }
}

module.exports = CreepProcess;