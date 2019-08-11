const Process = require('Process');

class SpawnCreep extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
        this.creepName = this.memory.creepName;
        this.creepBodyType = this.memory.creepBodyType;
        this.creepProcessClass = this.memory.creepProcessClass;
        this.creepMemory = this.memory.creepMemory;
        this.creepPriority = this.memory.creepPriority;
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(Game.creeps[this.creepName] !== undefined) {
            console.log('Creep is spawned for ' + this.pid);
        }

        else if(this.colony.spawnIsAvailable()) {
            this.colony.spawnCreep(this.creepName, this.creepBodyType, this.creepProcessClass, this.creepMemory, this.creepPriority, this.scheduler);
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = SpawnCreep;