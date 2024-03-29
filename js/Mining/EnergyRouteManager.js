const Process = require('Process');
const BodyGenerator = require('BodyGenerator');

class EnergyRouteManager extends Process {
    constructor (...args) {
        super(...args);
        
        var targetSourcePos = new RoomPosition(this.memory.targetSourcePos.x, this.memory.targetSourcePos.y, this.memory.targetSourcePos.roomName);
        this.targetSourcePos = targetSourcePos;
        this.targetStorageRoom = Game.rooms[this.memory.targetStorageRoom];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
        this.haulerCount = DEFAULT_ENERGY_HAULER_COUNT;

        if(this.memory.containerPos == null) {
            this.determineContainerPos();
        }

        if(!this.spawnColony.isPreStorage) {
            var harvestDest = Game.rooms[this.memory.targetStorageRoom].harvestDestination;
            if(this.memory.routeDistance == null && harvestDest != null) {
                var routePath = this.spawnColony.roadmap.findRoadPath(harvestDest.pos, targetSourcePos, 'mining');
                this.memory.routeDistance = routePath.length;
            }

            if(this.memory.routeDistance != null) {
                var adjustedHaulerCount = Math.ceil(this.memory.routeDistance/DIST_PER_HAULER_POST_STORAGE);
                this.haulerCount = adjustedHaulerCount;
            }
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.memory.containerPos == null || this.targetStorageRoom == null) {
            this.spawnScout();
            return 'continue';
        }

        this.drawRouteInfo();

        this.spawnMiner();

        if(this.minerExists && this.sourceContainerExists) {
            this.spawnHauler();
        }

        if(this.shouldReserve) {
            this.spawnReserver();
        }
    }

    drawRouteInfo() {
        var format = {align: 'left'};
        new RoomVisual(this.memory.containerPos['roomName']).text('Dest: ' + this.targetStorageRoom.name, this.memory.containerPos['x'] + 1, this.memory.containerPos['y'], format);
        new RoomVisual(this.memory.containerPos['roomName']).text('Dist: ' + this.memory.routeDistance, this.memory.containerPos['x'] + 1, this.memory.containerPos['y'] + 1, format);
        new RoomVisual(this.memory.containerPos['roomName']).text('Haul: ' + this.haulerCount, this.memory.containerPos['x'] + 1, this.memory.containerPos['y'] + 2, format);

        if(this.sourceContainer != null) {
            var sourceContainerIsFull = this.sourceContainer.store.getFreeCapacity() == 0;
    
            if(sourceContainerIsFull) {
                Game.map.visual.text('⛔️', this.sourceContainer.pos, {color: '#FFFF33', fontSize: 3, align: 'center', opacity: 1.0});
            }
        }
    }

    isOperational() {
        if(this.memory.containerPos == null) return false;

        var notWaitingForReserver = !this.waitingForReserver

        var isOperational = (this.minerExists && this.allHaulersExist && notWaitingForReserver)

        return isOperational;
    }

    get minerExists() {
        var minerName = this.targetSourcePos.readableString() +'|Miner|0';
        return Game.creeps[minerName] != null;
    }

    get allHaulersExist() {
        var allHaulersExist = true;
        for(var i = 0; i < this.haulerCount; i++) {
            var haulerName = this.targetSourcePos.readableString() +'|Hauler|' + i;
            allHaulersExist = (Game.creeps[haulerName] != null);

            if(!allHaulersExist) break;
        }

        return allHaulersExist;
    }

    get waitingForReserver() {        
        var waitingForReserver = false;
        if(this.shouldReserve) {
            var reserverName = 'reserver|' + this.targetSourcePos.roomName + '|0';

            waitingForReserver = (Game.creeps[reserverName] == null);
        }

        return waitingForReserver;
    }

    get sourceContainerExists() {
        return (this.sourceContainer != null);
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

        if(this.shouldReserve) {
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
            }
        };
        
        var spawnPID = 'SpawnMiner|' + this.targetSourcePos.readableString() + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    spawnHauler() {
        var data = {
            'colonyName': this.memory.spawnColonyName,
            'creepCount': this.haulerCount,
            'creepNameBase': this.targetSourcePos.readableString() +'|Hauler',
            'creepBodyType': 'Hauler',
            'creepProcessClass': 'Hauler',
            'creepMemory': {
                'targetStorageRoom': this.targetStorageRoom.name,
                'containerPos': this.memory.containerPos
            }
        };
        
        var spawnPID = 'SpawnHauler|' + this.targetSourcePos.readableString() + '|' + this.memory.spawnColonyName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    get shouldReserve() {
        //Should reserve if it's not 
        var room = Game.rooms[this.targetSourcePos.roomName];

        if(room == null || room.controller == null) return false;

        var isOneOfMyRooms = (room.controller != null && room.controller.my && room.controller.level > 0);

        if(isOneOfMyRooms) return false;

        var reserverBody = BodyGenerator.generateBody('Reserver', 0);
        var costOfBody = BodyGenerator.getCostOfBody(reserverBody);

        if(this.spawnColony.primaryRoom.energyCapacityAvailable < costOfBody && this.spawnColony.secondaryRoom != null && this.spawnColony.secondaryRoom.energyCapacityAvailable < costOfBody) {
            //We don't have enough energy capacity
            return false;
        }

        var reservation = room.controller.reservation;
        if(reservation == null) return true;

        return reservation.ticksToEnd < REMAINING_TICKS_TO_SPAWN_RESERVER;
    }

    get sourceContainer() {
        if(this.memory.containerPos == null) return null;

        var containerPos = new RoomPosition(this.memory.containerPos.x, this.memory.containerPos.y, this.memory.containerPos.roomName);

        return containerPos.getStructure(STRUCTURE_CONTAINER);
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
            }
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
            }
        };

        var spawnPID ='spawnReserver|' + this.targetSourcePos.roomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, this.metadata.defaultPriority);
    }

    determineContainerPos() {
        if(Game.rooms[this.targetSourcePos.roomName] == null) {
            console.log('Cannot reach room for target source');
            return;
        }

        var containerPos = this.targetSourcePos.getOpenAdjacentPos();

        var container = this.targetSourcePos.getAdjacentStructures(STRUCTURE_CONTAINER)[0];

        if(container != null) {
            containerPos = container.pos;
        }

        var containerConstructionSpot = this.targetSourcePos.getAdjacentConstructionSites(STRUCTURE_CONTAINER)[0];

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

module.exports = EnergyRouteManager;