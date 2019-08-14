const Process = require('Process');

class ColonyManager extends Process {
    constructor (...args) {
        super(...args);

        this.primaryRoom = Game.rooms[this.memory.primaryRoom];
        this.name = this.primaryRoom.name;

        //if(this.memory.secondaryRoom) 
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


        //If we're pre-storage, bootstrap
    }

    roomIsPreStorage(room) {
        return (room.controller.level < 5 && room.storage === undefined);
    }

    processShouldDie() {
        return this.primaryRoom === undefined;
    }
}

module.exports = ColonyManager;