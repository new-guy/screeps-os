const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

var HAULER_COUNT = 2;

class EnergyRouteManager extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetSourcePos = new RoomPosition(this.memory.targetSourcePos.x, this.memory.targetSourcePos.y, this.memory.targetSourcePos.roomName);
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

        if(this.memory.containerPos === undefined || this.targetStorage === null) {
            this.spawnScout();
            return 'continue';
        }

        this.spawnMiner();
        this.spawnHauler();
    }

    isOperational() {
        if(this.memory.containerPos === undefined) return false;

        var minerName = this.targetSourcePos.readableString() +'|Miner|0';

        var allHaulersExist = true;
        for(var i = 0; i < HAULER_COUNT; i++) {
            var haulerName = this.targetSourcePos.readableString() +'|Hauler|' + i;
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
            'creepNameBase': this.targetSourcePos.readableString() +'|Miner',
            'creepBodyType': 'Miner',
            'creepProcessClass': 'Miner',
            'creepMemory': {
                'targetSourcePos': {
                    'x': this.targetSourcePos.x,
                    'y': this.targetSourcePos.y,
                    'roomName': this.targetSourcePos.roomName
                },
                'containerPos': this.memory.containerPos
            },
            'creepPriority': this.metadata.defaultPriority
        };
        
        var spawnPID = 'SpawnMiner|' + this.targetSourcePos.readableString() + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    spawnHauler() {
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': HAULER_COUNT,
            'creepNameBase': this.targetSourcePos.readableString() +'|Hauler',
            'creepBodyType': 'Hauler',
            'creepProcessClass': 'Hauler',
            'creepMemory': {
                'targetStorageId': this.targetStorage.id,
                'containerPos': this.memory.containerPos
            },
            'creepPriority': this.metadata.defaultPriority
        };
        
        var spawnPID = 'SpawnHauler|' + this.targetSourcePos.readableString() + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    spawnScout() {
        var data = {
            'colonyName': this.spawnColony.name,
            'creepCount': 1,
            'creepNameBase': 'miningScout|' + this.targetSourcePos.roomName,
            'creepBodyType': 'Scout',
            'creepProcessClass': 'Scout',
            'creepMemory': {
                'targetRoom': this.targetSourcePos.roomName
            },
            'creepPriority': COLONY_SCOUTING_PRIORITY
        };

        var spawnPID ='spawnMiningScout|' + this.targetSourcePos.roomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_SCOUTING_PRIORITY);
    }

    determineContainerPos() {
        if(Game.rooms[this.targetSourcePos.roomName] === undefined) {
            console.log('Cannot reach room for target source');
            return;
        }

        var containerPos = this.targetSourcePos.getOpenAdjacentPos();

        var container = this.targetSourcePos.getAdjacentStructures(STRUCTURE_CONTAINER)[0];

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