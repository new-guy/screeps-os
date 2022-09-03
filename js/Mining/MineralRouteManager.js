const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

class MineralRouteManager extends Process {
    constructor (...args) {
        super(...args);
        
        var targetMineralPos = new RoomPosition(this.memory.targetMineralPos.x, this.memory.targetMineralPos.y, this.memory.targetMineralPos.roomName);
        this.targetMineralPos = targetMineralPos;
        this.targetStorageRoom = Game.rooms[this.memory.targetStorageRoom];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
        this.haulerCount = 1;

        if(this.memory.containerPos == null) {
            this.determineContainerPos();
        }

        if(this.memory.mineralType == null) {
            var mineral = targetMineralPos.lookFor(LOOK_MINERALS)[0];
            this.memory.mineralType = mineral.mineralType;
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.drawRouteInfo();

        this.spawnMiner();

        if(this.minerExists && this.mineralContainerExists) {
            this.spawnHauler();
        }
    }

    drawRouteInfo() {
        var format = {align: 'left'};
        new RoomVisual(this.memory.containerPos['roomName']).text('Dest: ' + this.targetStorageRoom.name, this.memory.containerPos['x'] + 1, this.memory.containerPos['y'], format);
    }

    isOperational() {
        if(this.memory.containerPos == null) return false;

        var isOperational = (this.minerExists && this.allHaulersExist)

        return isOperational;
    }

    get minerExists() {
        var minerName = this.targetMineralPos.roomName + '|MineralMiner|0';
        return Game.creeps[minerName] != null;
    }

    get mineralContainerExists() {
        return (this.mineralContainer != null);
    }

    getUsedTicks() {
        var energyCapacity = this.spawnColony.primaryRoom.energyCapacityAvailable;

        if(this.spawnColony.secondaryRoom != null && this.spawnColony.secondaryRoom.energyCapacityAvailable > energyCapacity) {
            energyCapacity = this.spawnColony.secondaryRoom.energyCapacityAvailable;;
        }

        var haulerBody = BodyGenerator.generateBody('Hauler', energyCapacity);
        var ticksToSpawn = this.haulerCount * BodyGenerator.getTicksToSpawn(haulerBody);

        var minerBody = BodyGenerator.generateBody('Miner', energyCapacity);
        ticksToSpawn += BodyGenerator.getTicksToSpawn(minerBody);

        return ticksToSpawn;
    }

    spawnMiner() {
        var creepNameBase = this.targetMineralPos.roomName + '|MineralMiner'

        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': 1,
            'creepNameBase': creepNameBase,
            'creepBodyType': 'Miner',
            'creepProcessClass': 'Miner',
            'creepMemory': {
                'targetMineralPos': {
                    'x': this.targetMineralPos.x,
                    'y': this.targetMineralPos.y,
                    'roomName': this.targetMineralPos.roomName
                },
                'containerPos': this.memory.containerPos,
                'mineralType': this.memory.mineralType
            }
        };
        
        var spawnPID = 'SpawnMiner|' + creepNameBase + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    spawnHauler() {
        var creepNameBase = this.targetMineralPos.roomName + '|MineralHauler'
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': this.haulerCount,
            'creepNameBase': creepNameBase,
            'creepBodyType': 'Hauler',
            'creepProcessClass': 'Hauler',
            'creepMemory': {
                'targetStorageRoom': this.targetStorageRoom.name,
                'containerPos': this.memory.containerPos,
                'mineralType': this.memory.mineralType
            }
        };
        
        var spawnPID = 'SpawnHauler|' + creepNameBase + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    get mineralContainer() {
        if(this.memory.containerPos == null) return null;

        var containerPos = new RoomPosition(this.memory.containerPos.x, this.memory.containerPos.y, this.memory.containerPos.roomName);

        return containerPos.getStructure(STRUCTURE_CONTAINER);
    }

    determineContainerPos() {
        if(Game.rooms[this.targetMineralPos.roomName] == null) {
            console.log('Cannot reach room for target mineral');
            return;
        }

        var containerPos = this.targetMineralPos.getOpenAdjacentPos();

        var container = this.targetMineralPos.getAdjacentStructures(STRUCTURE_CONTAINER)[0];

        if(container != null) {
            containerPos = container.pos;
        }

        var containerConstructionSpot = this.targetMineralPos.getAdjacentConstructionSites(STRUCTURE_CONTAINER)[0];

        if(containerConstructionSpot != null) {
            containerPos = containerConstructionSpot.pos;
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

module.exports = MineralRouteManager;