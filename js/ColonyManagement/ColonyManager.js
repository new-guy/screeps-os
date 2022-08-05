const Process = require('Process');

class ColonyManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.primaryRoom];
        this.primaryRoom = Game.rooms[this.memory.primaryRoom];
        this.name = this.primaryRoom.name;

        if(this.colony.memory.secondaryRoomName !== undefined) {
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
        
        this.ensureChildProcess(this.primaryRoom.name + '|scoutingManager', 'ColonyScoutingManager', {'colonyName': this.name}, COLONY_SCOUTING_PRIORITY);

        if(this.primaryRoom.isInComa() || (this.secondaryRoom !== undefined && this.secondaryRoom.isInComa())) {
            console.log('Coma Recovery');
            this.comaRecovery();
        }

        this.normalBehavior();

        this.updateRoomStates(this.primaryRoom);

        if(this.secondaryRoom !== undefined) {
            this.updateRoomStates(this.secondaryRoom);
        }
    }

    ensureRoomManagement() {
        this.ensureChildProcess(this.primaryRoom.name + '|constructionMonitor', 'HomeRoomConstructionMonitor', {'roomName': this.primaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
        this.ensureChildProcess(this.primaryRoom.name + '|planConFlagMonitor', 'PlanningConstructionFlagMonitor', {'roomName': this.primaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
        this.ensureChildProcess(this.primaryRoom.name + '|homeroomManager', 'HomeRoomManager', {'roomName': this.primaryRoom.name, 'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);

        if(this.secondaryRoom !== undefined && this.secondaryRoom.controller.my && this.secondaryRoom.controller.level > 0) {
            this.ensureChildProcess(this.secondaryRoom.name + '|constructionMonitor', 'HomeRoomConstructionMonitor', {'roomName': this.secondaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
            this.ensureChildProcess(this.secondaryRoom.name + '|planConFlagMonitor', 'PlanningConstructionFlagMonitor', {'roomName': this.secondaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
            this.ensureChildProcess(this.secondaryRoom.name + '|homeroomManager', 'HomeRoomManager', {'roomName': this.secondaryRoom.name, 'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);
        }
    }

    ensureMiningRoutes() {
        if(this.primaryRoom.controller.level < 2) return;

        if(this.primaryRoom.harvestDestination !== undefined || (this.secondaryRoom !== undefined && this.secondaryRoom.harvestDestination !== undefined)) {
            this.ensureChildProcess(this.name + '|energyHarvestingManager', 'EnergyHarvestingManager', {'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);
        }
    }

    comaRecovery() {
        if(this.primaryRoom.isInComa()) {
            this.ensureChildProcess(this.primaryRoom.name + '|comaRecovery', 'ComaRecovery', {
                'targetRoomName': this.primaryRoom.name,
                'spawnColonyName': this.name,
                'creepNameBase': this.primaryRoom.name + '|comaRecovery'
            }, HIGHEST_PROMOTABLE_PRIORITY);
        }

        if(this.secondaryRoom !== undefined && this.secondaryRoom.isInComa()) {
            this.ensureChildProcess(this.secondaryRoom.name + '|comaRecovery', 'ComaRecovery', {
                'targetRoomName': this.secondaryRoom.name,
                'spawnColonyName': this.name,
                'creepNameBase': this.secondaryRoom.name + '|comaRecovery'
            }, HIGHEST_PROMOTABLE_PRIORITY);
        }
    }

    normalBehavior() {
        if(this.colony.isPreStorage) {
            var bootstrapPID = 'preStorColonyBoot|' + this.name + '|' + this.name;
            var data = {'targetColonyName': this.name, 'spawnColonyName': this.name};
            this.ensureChildProcess(bootstrapPID, 'PreStorageColonyBootstrap', data, COLONY_MANAGEMENT_PRIORITY);
        }

        else {
            console.log('Need to implement post-storage functionality');
        }

        if(this.colony.memory.secondaryRoomName === undefined) { //If we have not figured out the secondaryRoom name, ensure a process to find the room
            this.ensureChildProcess(this.primaryRoom.name + '|secondaryRoomFinder', 'SecondaryRoomFinder', {'colonyName': this.name}, COLONY_NONESSENTIAL_PRIORITY);
        }

        else if((Game.empire.hasSpareGCL && this.colony.primaryRoom.energyCapacityAvailable >= 650) || (this.colony.secondaryRoom !== undefined && this.colony.secondaryRoom.controller.my)) {
            this.ensureSecondaryRoom()
        }
        
        //we only really wanna build roads if we can have a tower in the homeroom 'cause of repair time and cost
        if(this.colony.primaryRoom.controller.level >= 3) {
            this.ensureRoadGeneration();
        }
    }

    ensureSecondaryRoom() {
        if((this.secondaryRoom !== undefined && !this.secondaryRoom.controller.my)) {
            this.spawnSecondaryRoomClaimer();
        }

        if(this.secondaryRoom !== undefined && this.secondaryRoom.controller.my) {
            //Secondary Room Self-Bootstrap            
            if(this.secondaryRoom.controller.level <= 4) {
                var bootstrapPID = 'preStorSecondBoot|' + this.name + '|' + this.name;
                var data = {'targetColonyName': this.name, 'spawnColonyName': this.name, 'spawnPidPrefix': 'second'};
                this.ensureChildProcess(bootstrapPID, 'PreStorageColonyBootstrap', data, COLONY_MANAGEMENT_PRIORITY);
            }

            //Bootstrap Scheduling
            if(this.secondaryRoom.controller.level < 2) {
                var bootstrapPID = 'secondaryExpandBootstrap|' + this.primaryRoom.name;
                var data = {'targetRoomName': this.colony.memory.secondaryRoomName, 'spawnColonyName': this.primaryRoom.name};
                this.ensureChildProcess(bootstrapPID, 'ExpansionBootstrap', data, COLONY_EXPANSION_SUPPORT);
            }
        }
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
        this.ensureChildProcess(this.primaryRoom.name + '|roadGenerator', 'RoadGenerator', {'colonyName': this.name}, COLONY_NONESSENTIAL_PRIORITY);
    }

    processShouldDie() {
        return this.primaryRoom === undefined;
    }
}

module.exports = ColonyManager;
