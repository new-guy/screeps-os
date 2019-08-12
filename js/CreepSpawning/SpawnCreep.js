const Process = require('Process');

class SpawnCreep extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
        this.creepCount = this.memory.creepCount;
        this.creepNameBase = this.memory.creepNameBase;
        this.creepBodyType = this.memory.creepBodyType;
        this.creepProcessClass = this.memory.creepProcessClass;
        this.creepMemory = this.memory.creepMemory;
        this.creepPriority = this.memory.creepPriority;
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.colony.spawnIsAvailable()) {
            for(var i = 0; i < this.creepCount; i++) {
                if(Game.creeps[this.creepNameBase] !== undefined) {
                    //creep exists
                    continue;
                }
        
                var creepName = this.creepNameBase + "|" + i;
                console.log(this.pid + ' trying to spawn ' + creepName);
                this.colony.spawnCreep(creepName, this.creepBodyType, this.creepProcessClass, this.creepMemory, this.creepPriority, this.scheduler);
                break;
            }
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = SpawnCreep;