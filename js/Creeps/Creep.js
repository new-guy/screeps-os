const Process = require('Process');

class Creep extends Process {
    constructor (...args) {
        super(...args);

        this.creep = Game.creeps[this.memory.creepName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.creep.spawning) {
            console.log(this.creep.name + ' is spawning');
        }

        else {
            this.creep.say('sup')
        }
    }

    processShouldDie() {
        var myCreepExists = (this.creep !== undefined);

        if(!myCreepExists) {
            console.log('Killing process ' + this.pid + ' because creep does not exist');
        }

        return !myCreepExists;
    }
}

module.exports = Creep;