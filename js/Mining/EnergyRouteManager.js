const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

var HAULER_COUNT = 2;

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

        if(this.memory.containerPos === undefined || this.targetSource === null || this.targetStorage === null) {
            return 'continue';
        }

        this.spawnMiner();
        this.spawnHauler();
    }

    isOperational() {
        if(this.targetSource === null) {
            return false;
        }

        var minerName = this.targetSource.pos.readableString() +'|Miner|0';

        var allHaulersExist = true;
        for(var i = 0; i < HAULER_COUNT; i++) {
            var haulerName = this.targetSource.pos.readableString() +'|Hauler|' + i;
            allHaulersExist = (Game.creeps[haulerName] !== undefined);

            if(!allHaulersExist) break;
        }

        return (Game.creeps[minerName] !== undefined && allHaulersExist);
    }

    getUsedTicks() {
        var energyCapacity = this.spawnColony.primaryRoom.energyCapacityAvailable;

        if(this.spawnColony.secondaryRoom !== undefined && this.spawnColony.secondaryRoom.energyCapacityAvailable > energyCapacity) {
            energyCapacity = this.spawnColony.secondaryRoom.energyCapacityAvailable;;
        }

        var haulerBody = BodyGenerator.generateBody('Hauler', energyCapacity);
        var ticksToSpawn = HAULER_COUNT * BodyGenerator.getTicksToSpawn(haulerBody);

        var minerBody = BodyGenerator.generateBody('Miner', energyCapacity);
        ticksToSpawn += BodyGenerator.getTicksToSpawn(minerBody);

        return ticksToSpawn;
    }

    spawnMiner() {
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': 1,
            'creepNameBase': this.targetSource.pos.readableString() +'|Miner',
            'creepBodyType': 'Miner',
            'creepProcessClass': 'Miner',
            'creepMemory': {
                'targetSourceId': this.targetSource.id,
                'containerPos': this.memory.containerPos
            },
            'creepPriority': this.metadata.defaultPriority
        };
        
        var spawnPID = 'SpawnMiner|' + this.targetSource.pos.readableString() + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    spawnHauler() {
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': HAULER_COUNT,
            'creepNameBase': this.targetSource.pos.readableString() +'|Hauler',
            'creepBodyType': 'Hauler',
            'creepProcessClass': 'Hauler',
            'creepMemory': {
                'targetStorageId': this.targetStorage.id,
                'containerPos': this.memory.containerPos
            },
            'creepPriority': this.metadata.defaultPriority
        };
        
        var spawnPID = 'SpawnHauler|' + this.targetSource.pos.readableString() + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    determineContainerPos() {
        var containerPos = this.targetSource.pos.getOpenAdjacentPos();

        var container = this.targetSource.pos.getAdjacentStructures(STRUCTURE_CONTAINER)[0];

        if(container !== undefined) {
            containerPos = container.pos;
        }

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