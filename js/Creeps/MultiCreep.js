const Process = require('Process');

class MultiCreep extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
        this.creepNameBase = this.memory.creepNameBase;

        this.desiredCreeps = [];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.ensureDesiredCreeps();

        if(!this.hasDesiredCreeps()) {
            this.waitingBehavior();
        }

        else {
            this.mainBehavior();
        }
    }

    hasDesiredCreeps() {
        return this.getDesiredCreeps().length === this.desiredCreeps.length;
    }

    getDesiredCreeps() {
        var creeps = [];
        var creepTypeCount = {};

        for(var i = 0; i < this.desiredCreeps.length; i++) {
            var creepType = this.desiredCreeps[i];
            var typeIndex = creepTypeCount[creepType] == null ? 0 : creepTypeCount[creepType];
            var creepName = this.getRealCreepName(this.desiredCreeps[i], typeIndex);
            var creep = Game.creeps[creepName];

            if(creepTypeCount[creepType] == null) {
                creepTypeCount[creepType] = 1;
            }
            else {
                creepTypeCount[creepType] = creepTypeCount[creepType] + 1;
            }

            if(creep != null && !creep.spawning) {
                creeps.push(creep);
            }
        }

        return creeps;
    }

    getDesiredCreepTypeCount(creepType) {
        var count = 0;
        for(var i = 0; i < this.desiredCreeps.length; i++) {
            if(this.desiredCreeps[i] === creepType) {
                count++;
            }
        }
        return count;
    }

    getCreepNameBase(suffix) {
        return this.creepNameBase + '|' + suffix;
    }

    getRealCreepName(suffix, index=0) {
        return this.creepNameBase + '|' + suffix + '|' + index;
    }

    ensureDesiredCreeps() {
        var creepTypesEnsured = [];
        
        for(var i = 0; i < this.desiredCreeps.length; i++) {
            var creepType = this.desiredCreeps[i];

            if(creepTypesEnsured.includes(creepType)) continue;
            var creepName = this.getCreepNameBase(creepType);
            var creepCount = this.getDesiredCreepTypeCount(creepType);

            var data = {
                'colonyName': this.colony.name,
                'creepCount': creepCount,
                'creepNameBase': creepName,
                'creepBodyType': creepType,
                'creepProcessClass': 'CreepProcess',
                'creepMemory': {},
                'maxEnergyToSpend': this.colony.primaryRoom.energyCapacityAvailable
            };
            
            var spawnPID = 'spawn|' + creepName + '|' + creepCount;
            this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_OFFENSE_PRIORITY);

            creepTypesEnsured.push(creepType);
        }
    }

    waitingBehavior() {
    }

    mainBehavior() {
    }

    moveCreeps(creeps) {
    }
}

module.exports = MultiCreep;