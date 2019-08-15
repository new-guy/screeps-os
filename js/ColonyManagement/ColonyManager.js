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

        this.ensureChildProcess(this.primaryRoom.name + '|constructionMonitor', 'HomeRoomConstructionMonitor', {'roomName': this.primaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
        this.ensureChildProcess(this.primaryRoom.name + '|planConFlagMonitor', 'PlanningConstructionFlagMonitor', {'roomName': this.primaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
        this.ensureChildProcess(this.primaryRoom.name + '|scoutingManager', 'ColonyScoutingManager', {'colonyName': this.name}, COLONY_SCOUTING_PRIORITY);

        this.ensureChildProcess(this.primaryRoom.name + '|homeroomManager', 'HomeRoomManager', {'roomName': this.primaryRoom.name, 'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);

        if(this.roomIsPreStorage(this.primaryRoom)) {
            var bootstrapPID = 'preStorSelfBoot|' + this.primaryRoom.name + '|' + this.primaryRoom.name;
            var data = {'targetRoomName': this.primaryRoom.name, 'spawnColonyName': this.primaryRoom.name};
            this.ensureChildProcess(bootstrapPID, 'PreStorageSelfBootstrap', data, COLONY_MANAGEMENT_PRIORITY);
        }

        else {
            console.log('Need to implement post-storage functionality');
        }

        if(this.colony.memory.secondaryRoomName === undefined) { //If we have not figured out the secondaryRoom name, ensure a process to find the room
            this.ensureChildProcess(this.primaryRoom.name + '|secondaryRoomFinder', 'SecondaryRoomFinder', {'colonyName': this.name}, COLONY_MANAGEMENT_PRIORITY);
        }

        else if(this.colony.primaryRoom.energyCapacityAvailable >= 650 || (this.colony.secondaryRoom !== undefined && this.colony.secondaryRoom.controller.my)) {
            this.ensureSecondaryRoom()
        }
    }

    ensureSecondaryRoom() {
        if( this.secondaryRoom === undefined || 
            this.secondaryRoom !== undefined && (!this.secondaryRoom.controller.my || this.secondaryRoom.controller.level < 2)) {
            var bootstrapPID = 'secondaryExpandBootstrap|' + this.primaryRoom.name;
            var data = {'targetRoomName': this.colony.memory.secondaryRoomName, 'spawnColonyName': this.primaryRoom.name};
            this.ensureChildProcess(bootstrapPID, 'ExpansionBootstrap', data, COLONY_MANAGEMENT_PRIORITY);
        }
        
        else if(this.secondaryRoom !== undefined) {
            //Do Secondary Room Control
            console.log('Secondary Room');
        }

        console.log(this.secondaryRoom);
        if(this.secondaryRoom !== undefined && this.secondaryRoom.controller.my && this.secondaryRoom.controller.level > 0) {
            console.log('hi');
            this.ensureChildProcess(this.secondaryRoom.name + '|constructionMonitor', 'HomeRoomConstructionMonitor', {'roomName': this.secondaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
            this.ensureChildProcess(this.secondaryRoom.name + '|planConFlagMonitor', 'PlanningConstructionFlagMonitor', {'roomName': this.secondaryRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
        }
    }

    roomIsPreStorage(room) {
        return (room.controller.level < 5 && room.storage === undefined);
    }

    processShouldDie() {
        return this.primaryRoom === undefined;
    }
}

module.exports = ColonyManager;