const Process = require('Process');
const BodyGenerator = require('BodyGenerator');


class PreStorageSelfBootstrap extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        var bootstrapperBody = BodyGenerator.generateBody('BootStrapper', this.targetRoom.energyCapacityAvailable);
        var ticksToSpawn = BodyGenerator.getTicksToSpawn(bootstrapperBody);
        var bootstrappersToSpawn = Math.floor(PRE_STORAGE_BOOTSTRAPPER_MAX_SPAWN_TICKS/ticksToSpawn); //Do not spawn more than a single spawner can support

        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, PRE_STORAGE_BOOTSTRAPPER_MAX); //Do not spawn more than the PRE_STORAGE_BOOTSTRAPPER_MAX_SPAWN_TICKS

        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': bootstrappersToSpawn,
            'creepNameBase': 'bootstrapper|' + this.targetRoom.name,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetRoom': this.targetRoom.name
            }
        };
        
        var spawnPID = 'spawnPreStorSelfBoot|' + bootstrappersToSpawn + '|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    processShouldDie() {
        return (this.targetRoom.controller.level > 5 || this.targetRoom.storage !== undefined);
    }
}

module.exports = PreStorageSelfBootstrap;