const Process = require('Process');

class Bobsled extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
        this.creepNameBase = this.memory.creepNameBase;
        this.targetFlagName = this.memory.targetFlagName;
        this.rallyFlagName = '!RALLY|' + this.memory.colonyName;

        this.desiredCreeps = ['Melee', 'Healer'];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(!this.hasDesiredCreeps()) {
            this.ensureDesiredCreeps();
            this.waitingBehavior();
        }

        else {
            this.mainBehavior();
        }
        
        // var creeps = this.getDesiredCreeps();

    }

    hasDesiredCreeps() {
        return this.getDesiredCreeps().length === this.desiredCreeps.length;
    }

    getDesiredCreeps() {
        var creeps = [];

        for(var i = 0; i < this.desiredCreeps.length; i++) {
            var creepName = this.getRealCreepName(this.desiredCreeps[i]);
            var creep = Game.creeps[creepName];

            if(creep != null) {
                creeps.push(creep);
            }
        }

        return creeps;
    }

    getMissingCreepTypes() {
        var creepNames = [];

        for(var i = 0; i < this.desiredCreeps.length; i++) {
            var creepName = this.getCreepNameBase(this.desiredCreeps[i]);
            var creep = Game.creeps[creepName];

            if(creep == null) {
                creepNames.push(this.desiredCreeps[i]);
            }
        }

        return creepNames;
    }

    getCreepNameBase(suffix) {
        return this.creepNameBase + '|' + suffix;
    }

    getRealCreepName(suffix) {
        return this.creepNameBase + '|' + suffix + '|0';
    }

    ensureDesiredCreeps() {
        var missingCreepTypes = this.getMissingCreepTypes();

        for(var i = 0; i < missingCreepTypes.length; i++) {
            var creepType = missingCreepTypes[i];
            var creepName = this.getCreepNameBase(creepType);

            var data = {
                'colonyName': this.colony.name,
                'creepCount': 1,
                'creepNameBase': creepName,
                'creepBodyType': creepType,
                'creepProcessClass': 'CreepProcess',
                'creepMemory': {},
                'maxEnergyToSpend': this.colony.primaryRoom.energyCapacityAvailable
            };
            
            var spawnPID = 'spawnM|' + creepName;
            this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_OFFENSE_PRIORITY);
        }
    }

    waitingBehavior() {
        var rallyFlag = Game.flags[this.rallyFlagName];

        if(rallyFlag == null) {
            console.log('MISSING RALLY FLAG ' + this.rallyFlagName);
            return;
        }

        var creeps = this.getDesiredCreeps();

        for(var i = 0; i < creeps.length; i++) {
            var creep = creeps[i];
            if(creep.spawning) continue;
            creep.moveTo(rallyFlag.pos);
        }
    }

    mainBehavior() {
        var creeps = this.getDesiredCreeps();
        this.moveCreeps(creeps);
    }

    moveCreeps(creeps) {
        if(this.creepsAreSeparated(creeps)) {
            this.uniteCreeps(creeps);
        }

        else {
            var targetFlag = Game.flags[this.targetFlagName];

            var lastCreep = creeps[creeps.length - 1];
            if(lastCreep.pos.roomName != targetFlag.pos.roomName) {
                this.moveCreepsTo(creeps, targetFlag.pos, true)
            }
        }
    }

    moveCreepsTo(creeps, pos, forward) {
        var leadCreep = forward ? creeps[0] : creeps[creeps.length - 1];

        leadCreep.moveTo(pos);
        leadCreep.say('🚌 ');

        if(forward) {
            for(var i = 1; i < creeps.length; i++) {
                var leader = creeps[i-1];
                var follower = creeps[i];
                follower.moveTo(leader.pos, {ignoreCreeps: true});
                follower.say('🧘‍♀️');
            }
        }
        else {
            for(var i = creeps.length-2; i >= 0; i--) {
                var leader = creeps[i+1];
                var follower = creeps[i];
                follower.moveTo(leader.pos, {ignoreCreeps: true});
                follower.say('🧘‍♀️');
            }
        }
    }
    
    creepsAreSeparated(creeps) {
        for(var i = 0; i < creeps.length-1; i++) {
            var creepOne = creeps[i];
            var creepTwo = creeps[i+1];
            var bothCreepsAreOnEdge = creepOne.pos.isEdge() && creepTwo.pos.isEdge();
            if(creepOne.pos.getRangeTo(creepTwo) > 1 && !bothCreepsAreOnEdge) {
                return true;
            }
        }
    }

    uniteCreeps(creeps) {
        for(var i = 0; i < creeps.length-1; i++) {
            var creepOne = creeps[i];
            var creepTwo = creeps[i+1];
            if(creepOne.pos.getRangeTo(creepTwo) > 1) {
                creepTwo.moveTo(creepOne);
                creepOne.say('🚶')
            } else {
                creepOne.say('⌚')
            }
        }
    }
}

module.exports = Bobsled;