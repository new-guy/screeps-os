const Process = require('Process');

const TIME_TO_WAIT_FOR_CREEP = 100;

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

        if(this.memory.timeWaited === undefined) {
            this.memory.timeWaited = 0;
        }

        var timeWaited = this.memory.timeWaited;

        var shouldDie = !myCreepExists && timeWaited > TIME_TO_WAIT_FOR_CREEP;
        if(shouldDie) {
            console.log('Killing process ' + this.pid + ' because creep does not exist');
        }

        this.memory.timeWaited = this.memory.timeWaited + 1;

        return shouldDie;
    }
}

module.exports = CreepProcess;