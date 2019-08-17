const Process = require('Process');

class EnergyRouteManager extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetSource = Game.getObjectById(this.memory.targetSourceId);
        this.targetStorage = Game.getObjectById(this.memory.targetStorageId);
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];

        if(this.memory.containerPos === undefined) {
            this.determineContainerPos();
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        // this.spawnMiner();
        // this.spawnHauler();
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

    determineContainerPos() {
        var containerPos = this.targetSource.pos.getOpenAdjacentPos();

        this.memory.containerPos = {
            'roomName': containerPos.roomName,
            'x': containerPos.x,
            'y': containerPos.y
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = EnergyRouteManager;