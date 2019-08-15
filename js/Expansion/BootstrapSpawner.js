const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

var DEFAULT_MAX_COUNT = 2;
var DEFAULT_TICKS = 200;
var DEFAULT_MAX_ENERGY = 3000;

class BootstrapSpawner extends Process {
    constructor (...args) {
        super(...args);

        /*
        Set:
        targetRoom
        spawnColony
        maxToSpawn
        maxTicksToUse
        maxEnergy
        creepNameBase
        */
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
        this.maxToSpawn = this.memory.maxToSpawn ? this.memory.maxToSpawn : DEFAULT_MAX_COUNT;
        this.maxTicksToUse = this.memory.maxTicksToUse ? this.memory.maxTicksToUse : DEFAULT_TICKS;
        this.maxEnergy = this.memory.maxEnergy ? this.memory.maxEnergy : DEFAULT_MAX_ENERGY;
        this.creepNameBase = this.memory.creepNameBase ? this.memory.creepNameBase + "|" : "";
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.spawnBootstrappers();
    }

    spawnBootstrappers() {
        var bootstrapperBody = BodyGenerator.generateBody('BootStrapper', this.spawnColony.primaryRoom.energyCapacityAvailable);
        var ticksToSpawn = BodyGenerator.getTicksToSpawn(bootstrapperBody);
        var bootstrappersToSpawn = Math.floor(this.maxTicksToUse/ticksToSpawn); //Do not spawn more than this many ticks

        var bodyCost = BodyGenerator.getCostOfBody(bootstrapperBody);
        var maxWeCanAfford = Math.floor(this.maxEnergy/bodyCost);
        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, maxWeCanAfford);//Do not spawn more than we can afford

        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, this.maxToSpawn); //Do not spawn more than the max

        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': bootstrappersToSpawn,
            'creepNameBase': this.creepNameBase +'Bootstrap|' + this.memory.targetRoomName,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetRoom': this.memory.targetRoomName
            },
            'creepPriority': this.metadata.defaultPriority
        };
        
        var spawnPID = this.creepNameBase + 'SpawnBootstrap|' + bootstrappersToSpawn + '|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = BootstrapSpawner;