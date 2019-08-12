const Process = require('Process');

var BOOTSTRAPPERS_TO_SPAWN = 10;

class PreStorageBootstrap extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': BOOTSTRAPPERS_TO_SPAWN,
            'creepNameBase': 'bootstrapper|' + this.targetRoom.name,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetRoom': this.targetRoom.name
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };
        
        var spawnPID = 'spawnPreStorBoot|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    processShouldDie() {
        return (this.targetRoom.controller.level > 5 || this.targetRoom.storage !== undefined);
    }
}

module.exports = PreStorageBootstrap;