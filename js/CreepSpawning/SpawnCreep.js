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
        this.maxEnergyToSpend = this.memory.maxEnergyToSpend;
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.colony.spawnIsAvailable(this.creepBodyType, this.maxEnergyToSpend)) {
            for(var i = 0; i < this.creepCount; i++) {
                var creepName = this.creepNameBase + "|" + i;
                var creepPid = 'creep|' + creepName;

                if(Game.creeps[creepName] != null || this.scheduler.processExists(creepPid)) {
                    if(Game.creeps[creepName] == null && this.scheduler.processExists(creepPid)) {
                        console.log('WAITING TO SPAWN CREEP ' + creepName + ' BECAUSE PROCESS EXISTS')
                    }
                    //creep exists or process exists
                    continue;
                }
                
                console.log(this.pid + ' trying to spawn ' + creepName);
                this.colony.spawnCreep(creepName, creepPid, this.creepBodyType, this.creepProcessClass, this.creepMemory, this.metadata.priority, this.maxEnergyToSpend);
                break;
            }
        }

        else {
            this.sleep(this.colony.timeTillAvailableSpawn);
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = SpawnCreep;