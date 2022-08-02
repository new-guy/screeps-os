const Process = require('Process');
const BodyGenerator = require('BodyGenerator');


class PreStorageColonyBootstrap extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetColony = Game.colonies[this.memory.targetColonyName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
        this.spawnPidPrefix = this.memory.spawnPidPrefix;
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        var bootstrapperBody = BodyGenerator.generateBody('BootStrapper', this.maxEnergyCapacityAvailable);
        var ticksToSpawn = BodyGenerator.getTicksToSpawn(bootstrapperBody);
        var bootstrappersToSpawn = Math.floor(PRE_STORAGE_BOOTSTRAPPER_MAX_SPAWN_TICKS/ticksToSpawn); //Do not spawn more than a single spawner can support

        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, PRE_STORAGE_BOOTSTRAPPER_MAX); //Do not spawn more than the PRE_STORAGE_BOOTSTRAPPER_MAX_SPAWN_TICKS

        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': bootstrappersToSpawn,
            'creepNameBase': 'colBootstrapper|' + this.targetColony.name,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetColony': this.targetColony.name
            }
        };
        
        var spawnPID = 'spawnPreStorSelfBoot|' + bootstrappersToSpawn + '|' + this.memory.spawnColonyName + '|' + this.memory.spawnColonyName;
        if(this.spawnPidPrefix !== undefined) {
            spawnPID = this.spawnPidPrefix + spawnPID;
            data['creepNameBase'] = this.spawnPidPrefix + data['creepNameBase']
        }
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    processShouldDie() {
        return !this.targetColony.isPreStorage;
    }
}

module.exports = PreStorageColonyBootstrap;