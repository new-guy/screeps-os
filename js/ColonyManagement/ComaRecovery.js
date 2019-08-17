const Process = require('Process');

var CREEPS_TO_SPAWN = 5;

class ComaRecovery extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
        this.creepNameBase = this.memory.creepNameBase ? this.memory.creepNameBase + "|" : "";
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.spawnBootstrappers();
    }

    spawnBootstrappers() {
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': CREEPS_TO_SPAWN,
            'creepNameBase': this.creepNameBase +'Bootstrap|' + this.memory.targetRoomName,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetRoom': this.memory.targetRoomName
            },
            'creepPriority': this.metadata.defaultPriority,
            'maxEnergyToSpend': 300
        };
        
        var spawnPID = this.creepNameBase + 'SpawnBootstrap|' + CREEPS_TO_SPAWN + '|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = ComaRecovery;