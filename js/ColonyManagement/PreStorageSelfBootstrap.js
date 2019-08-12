const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

var MAX_TO_SPAWN = 20;
var SPAWN_TICKS_TO_FILL = 1000;

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
        var bootstrappersToSpawn = Math.floor(SPAWN_TICKS_TO_FILL/ticksToSpawn);
        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, MAX_TO_SPAWN);

        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': bootstrappersToSpawn,
            'creepNameBase': 'bootstrapper|' + this.targetRoom.name,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetRoom': this.targetRoom.name
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };
        
        var spawnPID = 'spawnPreStorSelfBoot|' + bootstrappersToSpawn + '|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    processShouldDie() {
        return (this.targetRoom.controller.level > 5 || this.targetRoom.storage !== undefined);
    }
}

module.exports = PreStorageSelfBootstrap;