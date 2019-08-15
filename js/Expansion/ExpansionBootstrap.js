const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

var MAX_TO_SPAWN = 2;
var SPAWN_TICKS_TO_FILL = 200;
var MAX_ENERGY_TO_SPEND = 3000;

class ExpansionBootstrap extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.spawnBootstrappers();
        this.spawnClaimer();
    }

    spawnBootstrappers() {
        var bootstrapperBody = BodyGenerator.generateBody('BootStrapper', this.spawnColony.primaryRoom.energyCapacityAvailable);
        var ticksToSpawn = BodyGenerator.getTicksToSpawn(bootstrapperBody);
        var bootstrappersToSpawn = Math.floor(SPAWN_TICKS_TO_FILL/ticksToSpawn); //Do not spawn more than this many ticks

        var bodyCost = BodyGenerator.getCostOfBody(bootstrapperBody);
        var maxWeCanAfford = Math.floor(MAX_ENERGY_TO_SPEND/bodyCost);
        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, maxWeCanAfford);//Do not spawn more than we can afford

        bootstrappersToSpawn = Math.min(bootstrappersToSpawn, MAX_TO_SPAWN); //Do not spawn more than the max

        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': bootstrappersToSpawn,
            'creepNameBase': 'expandBootstrap|' + this.memory.targetRoomName,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetRoom': this.memory.targetRoomName
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };
        
        var spawnPID = 'spawnExpansionBootstrap|' + bootstrappersToSpawn + '|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    spawnClaimer() {
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': 1,
            'creepNameBase': 'expandClaimer|' + this.memory.targetRoomName,
            'creepBodyType': 'Claimer',
            'creepProcessClass': 'Claimer',
            'creepMemory': {
                'targetRoom': this.memory.targetRoomName
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };
        
        var spawnPID = 'spawnExpansionClaimer|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = ExpansionBootstrap;