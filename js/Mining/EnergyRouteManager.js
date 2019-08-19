const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

var HAULER_COUNT = 2;

var REMAINING_TICKS_TO_SPAWN_RESERVER = 3000;

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

        this.drawRouteInfo();

        this.spawnMiner();
        this.spawnHauler();

        if(this.shouldReserve()) {
            this.spawnReserver();
        }
    }

    drawRouteInfo() {
        var format = {align: 'left'};
        new RoomVisual(this.memory.containerPos['roomName']).text('Dest: ' + this.targetStorage.pos.roomName, this.memory.containerPos['x'] + 1, this.memory.containerPos['y'], format);
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

        var notWaitingForReserver = true;
        if(this.shouldReserve()) {
            var reserverName = 'reserver|' + this.targetSourcePos.roomName + '|0';

            notWaitingForReserver = (Game.creeps[reserverName] !== undefined);
        }

        var isOperational = (Game.creeps[minerName] !== undefined && allHaulersExist && notWaitingForReserver)

        if(!isOperational) {
            console.log('Miner: ' + (Game.creeps[minerName] !== undefined) + ' Haulers: ' + allHaulersExist + ' Reserver: ' + notWaitingForReserver);
        }

        return isOperational;
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

        if(this.shouldReserve()) {
            var reserverBody = BodyGenerator.generateBody('Reserver', energyCapacity);
            ticksToSpawn += BodyGenerator.getTicksToSpawn(reserverBody);
        }

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

    shouldReserve() {
        //Should reserve if it's not 
        var room = Game.rooms[this.targetSourcePos.roomName];

        if(room === undefined || room.controller === undefined) return false;

        var isOneOfMyRooms = (room.controller !== undefined && room.controller.my && room.controller.level > 0);

        if(isOneOfMyRooms) return false;

        var reserverBody = BodyGenerator.generateBody('Reserver', 0);
        var costOfBody = BodyGenerator.getCostOfBody(reserverBody);

        if(this.spawnColony.primaryRoom.energyCapacityAvailable < costOfBody && this.spawnColony.secondaryRoom !== undefined && this.spawnColony.secondaryRoom.energyCapacityAvailable < costOfBody) {
            //We don't have enough energy capacity
            return false;
        }

        var reservation = room.controller.reservation;
        if(reservation === undefined) return true;

        return reservation.ticksToEnd < REMAINING_TICKS_TO_SPAWN_RESERVER;
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

    spawnReserver() {
        var data = {
            'colonyName': this.spawnColony.name,
            'creepCount': 1,
            'creepNameBase': 'reserver|' + this.targetSourcePos.roomName,
            'creepBodyType': 'Reserver',
            'creepProcessClass': 'Reserver',
            'creepMemory': {
                'targetRoom': this.targetSourcePos.roomName
            },
            'creepPriority': this.metadata.defaultPriority
        };

        var spawnPID ='spawnReserver|' + this.targetSourcePos.roomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
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

        var containerConstructionSpot = this.targetSourcePos.getAdjacentConstructionSites(STRUCTURE_CONTAINER)[0];

        if(containerConstructionSpot !== undefined) {
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

module.exports = EnergyRouteManager;