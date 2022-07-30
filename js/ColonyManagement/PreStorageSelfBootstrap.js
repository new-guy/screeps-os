const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

var MAX_TO_SPAWN = 25;
var SPAWN_TICKS_TO_FILL = 1200;
var MAX_ENERGY_TO_SPEND = 8000;
var MAX_TINY_WORKERS = 15;

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
        var bootstrappersToSpawn = Math.floor(SPAWN_TICKS_TO_FILL/ticksToSpawn); //Do not spawn more than a single spawner can support

        var bodyCost = BodyGenerator.getCostOfBody(bootstrapperBody);
        var maxWeCanAfford = Math.floor(MAX_ENERGY_TO_SPEND/bodyCost);
        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, maxWeCanAfford);//Do not spawn more than we can afford

        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, MAX_TO_SPAWN); //Do not spawn more than the max

        if(this.targetRoom.energyCapacityAvailable < 500) {
            bootstrappersToSpawn = Math.min(bootstrappersToSpawn, MAX_TINY_WORKERS);
            console.log('hi');
        }

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