const Process = require('Process');

class ColonyManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.primaryRoom];
        this.primaryRoom = Game.rooms[this.memory.primaryRoom];
        this.name = this.primaryRoom.name;

        if(this.colony.memory.secondaryRoomName != null) {
            this.secondaryRoom = Game.rooms[this.colony.memory.secondaryRoomName];
        }
    }

    update() {
        console.log('Colony ' + this.pid + ' HomeRoom: ' + this.memory.primaryRoom);

        if(super.update() == 'exit') {
            return 'exit';
        }

        this.ensureRoomManagement();
        this.ensureMiningRoutes();
        
        this.ensureChildProcess(this.colony.name + '|scoutingManager', 'ColonyScoutingManager', {'colonyName': this.name}, COLONY_SCOUTING_PRIORITY);
        this.ensureChildProcess(this.colony.name + '|invaderMonitor', 'InvaderMonitor', {'colonyName': this.name}, COLONY_DEFENSE_PRIORITY);

        if(this.primaryRoom.isInComa() || (this.secondaryRoom != null && this.secondaryRoom.isInComa())) {
            console.log('Coma Recovery ' + this.colony.name);
            this.comaRecovery();
        }

        this.normalBehavior();

        this.updateRoomStates(this.primaryRoom);

        if(this.secondaryRoom != null) {
            this.updateRoomStates(this.secondaryRoom);
        }
    }

    ensureRoomManagement() {
        this.ensureChildProcess(this.primaryRoom.name + '|constructionMonitor', 'HomeRoomConstructionMonitor', {'roomName': this.primaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
        this.ensureChildProcess(this.primaryRoom.name + '|homeroomManager', 'HomeRoomManager', {'roomName': this.primaryRoom.name, 'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);

        if(this.secondaryRoom != null && this.secondaryRoom.controller.my && this.secondaryRoom.controller.level > 0) {
            this.ensureChildProcess(this.secondaryRoom.name + '|constructionMonitor', 'HomeRoomConstructionMonitor', {'roomName': this.secondaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
            this.ensureChildProcess(this.secondaryRoom.name + '|homeroomManager', 'HomeRoomManager', {'roomName': this.secondaryRoom.name, 'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);
        }
    }

    ensureMiningRoutes() {
        if(this.primaryRoom.controller.level < 2) return;

        if(this.primaryRoom.harvestDestination != null || (this.secondaryRoom != null && this.secondaryRoom.harvestDestination != null)) {
            this.ensureChildProcess(this.name + '|energyHarvestingManager', 'EnergyHarvestingManager', {'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);
        }
    }

    comaRecovery() {
        if(this.primaryRoom.isInComa() || (this.secondaryRoom != null && this.secondaryRoom.isInComa())) {
            this.ensureChildProcess(this.name + '|comaRecovery', 'ComaRecovery', {
                'targetColonyName': this.name,
                'spawnColonyName': this.name,
                'creepNameBase': this.name + '|comaRecovery'
            }, HIGHEST_PROMOTABLE_PRIORITY);
        }
    }

    normalBehavior() {
        if(this.colony.memory.secondaryRoomName == null) { //If we have not figured out the secondaryRoom name, ensure a process to find the room
            this.ensureChildProcess(this.primaryRoom.name + '|secondaryRoomFinder', 'SecondaryRoomFinder', {'colonyName': this.name}, COLONY_NONESSENTIAL_PRIORITY);
        }

        else if((Game.empire.hasSpareGCL && this.colony.primaryRoom.energyCapacityAvailable >= 650) || (this.colony.secondaryRoom != null && this.colony.secondaryRoom.controller.my)) {
            this.ensureSecondaryRoom()
        }
        
        //we only really wanna build roads if we can have a tower in the homeroom 'cause of repair time and cost
        if(this.colony.primaryRoom.controller.level >= 3) {
            this.ensureRoadGeneration();

            if(this.colony.roomsNeedingBuilder.length > 0 && this.colony.hasNecessaryMinimumEnergy) {
                this.ensureColonyBuilder();
            }

            if(this.colony.roomNeedingRoadRepairs != null && this.colony.hasNecessaryMinimumEnergy) {
                this.ensureRoadRepairer();
            }
        }

        if(this.colony.primaryRoom.controller.level >= 4) {
            this.checkForExpansionFlags();
        }
    }

    ensureSecondaryRoom() {
        if((this.secondaryRoom != null && !this.secondaryRoom.controller.my)) {
            this.spawnSecondaryRoomClaimer();
        }
    }

    ensureColonyBuilder() {
        var colonyBuilderCount = this.getColonyBuilderCount();

        var data = {
            'colonyName': this.colony.name,
            'creepCount': colonyBuilderCount,
            'creepNameBase': 'colonyBuilder|' + this.colony.name,
            'creepBodyType': 'ColonyBuilder',
            'creepProcessClass': 'ColonyBuilder',
            'creepMemory': {
                'targetColony': this.colony.name
            }
        };

        var spawnPID ='spawnColonyBuilder|' + this.colony.name + '|' + colonyBuilderCount;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_BUILDER_PRIORITY);
    }

    ensureRoadRepairer() {
        var roadRepairerCount = this.colony.roomsNeedingRoadRepairs.length;

        var data = {
            'colonyName': this.colony.name,
            'creepCount': roadRepairerCount,
            'creepNameBase': 'roadRepairer|' + this.colony.name,
            'creepBodyType': 'ColonyBuilder',
            'creepProcessClass': 'RoadRepairer',
            'creepMemory': {
                'targetColony': this.colony.name
            }
        };

        var spawnPID ='spawnRoadRepairer|' + this.colony.name + '|roadRepairerCount';
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_BUILDER_PRIORITY);
    }

    getColonyBuilderCount() {
        var count = 1;

        if(this.colony.primaryRoom.storage == null) {
            count++;
        }

        if(this.colony.secondaryRoom != null && this.colony.secondaryRoom.storage == null && this.colony.primaryRoom.harvestDestination != null) {
            count++;
        }

        if(this.colony.primaryRoom.hasNecessaryMinimumEnergy() || this.colony.secondaryRoom.hasNecessaryMinimumEnergy()) {
            count += this.colony.roomsNeedingBuilder.length;
        }
        
        count = Math.min(count, COLONY_MAX_BUILDER_COUNT);

        return count;
    }

    updateRoomStates(room) {
        //Set default if not in coma

        if(room.isInComa()) {
            room.memory.state = 'coma';
        }

        else {
            room.memory.state = 'default';
        }
    }

    spawnSecondaryRoomClaimer() {
        var data = {
            'colonyName': this.colony.name,
            'creepCount': 1,
            'creepNameBase': 'expandClaimer|' + this.secondaryRoom.name,
            'creepBodyType': 'Claimer',
            'creepProcessClass': 'Claimer',
            'creepMemory': {
                'targetRoom': this.secondaryRoom.name
            }
        };
        
        var spawnPID = 'spawnExpansionClaimer|' + this.colony.name + '|' + this.secondaryRoom.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    ensureRoadGeneration() {
        this.ensureChildProcess(this.name + '|roadGenerator', 'RoadGenerator', {'colonyName': this.name}, COLONY_NONESSENTIAL_PRIORITY);
    }

    checkForExpansionFlags() {
        var expansionRequestFlagName = '!EXPAND|'+this.name;
        var colonyExpansionRequestFlag = Game.flags[expansionRequestFlagName];
        if(colonyExpansionRequestFlag != null) {
            colonyExpansionRequestFlag.setColor(COLOR_PURPLE);
            var targetRoom = colonyExpansionRequestFlag.pos.roomName;
            var expansionPID = 'ExpansionManager|' + this.name + targetRoom;
            this.ensureChildProcess(expansionPID, 'ExpansionManager', {'spawnColony': this.colony.name, 'targetRoom': targetRoom}, COLONY_EXPANSION_SUPPORT)
        }
    }

    processShouldDie() {
        return this.primaryRoom == null;
    }
}

module.exports = ColonyManager;
