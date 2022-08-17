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

        var spawnColonyIsPreRCL3 = this.spawnColony.primaryRoom.controller.level < 3;
        var max_ticks = spawnColonyIsPreRCL3 ? PRE_RCL3_BOOTSTRAPPER_MAX_SPAWN_TICKS : PRE_STORAGE_BOOTSTRAPPER_MAX_SPAWN_TICKS;
        var bootstrappersToSpawn = Math.floor(max_ticks/ticksToSpawn); //Do not use more than the target max ticks

        var max_to_spawn = spawnColonyIsPreRCL3 ? PRE_RCL3_BOOTSTRAPPER_MAX : PRE_STORAGE_BOOTSTRAPPER_MAX;
        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, max_to_spawn); //Do not spawn more than the max_to_spawn

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

        if(this.spawnColony.secondaryRoom != null && this.spawnColony.primaryRoom.storage != null) {
            data['creepMemory'] = {
                'targetRoom': this.spawnColony.secondaryRoom.name
            }
        }
        
        var spawnPID = 'spawnPreStorSelfBoot|' + bootstrappersToSpawn + '|' + this.memory.spawnColonyName + '|' + this.memory.spawnColonyName;
        if(this.spawnPidPrefix != null) {
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