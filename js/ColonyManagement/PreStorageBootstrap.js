const Process = require('Process');

var BOOTSTRAPPERS_TO_SPAWN = 5;

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

        for(var i = 0; i < BOOTSTRAPPERS_TO_SPAWN; i++) {
            var data = {
                'colonyName': this.memory.spawnColonyName, 
                'creepName': 'bootstrapper|' + this.targetRoom.name + '|' + i,
                'creepBodyType': 'BootStrapper',
                'creepProcessClass': 'BootStrapper',
                'creepMemory': {
                    'targetRoom': this.targetRoom.name
                },
                'creepPriority': NECESSARY_CREEPS_PRIORITY
            };
            var spawnPID = 'spawnPreStorBoot|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName + '|' + i;
            this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
        }
    }

    processShouldDie() {
        return (this.targetRoom.controller.level > 5 || this.targetRoom.storage !== undefined);
    }
}

module.exports = PreStorageBootstrap;