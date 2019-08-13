const Process = require('Process');

class ColonyManager extends Process {
    constructor (...args) {
        super(...args);

        this.homeRoom = Game.rooms[this.memory.homeRoom];
    }

    update() {
        console.log('Colony ' + this.pid + ' HomeRoom: ' + this.memory.homeRoom);

        if(super.update() == 'exit') {
            return 'exit';
        }

        this.ensureChildProcess(this.homeRoom.name + '|constructionMonitor', 'HomeRoomConstructionMonitor', {'roomName': this.homeRoom.name}, COLONY_NONESSENTIAL_PRIORITY);
        this.ensureChildProcess(this.homeRoom.name + '|planConFlagMonitor', 'PlanningConstructionFlagMonitor', {'roomName': this.homeRoom.name}, COLONY_NONESSENTIAL_PRIORITY);

        if(this.roomIsPreStorage(this.homeRoom)) {
            var bootstrapPID = 'preStorSelfBoot|' + this.homeRoom.name + '|' + this.homeRoom.name;
            var data = {'targetRoomName': this.homeRoom.name, 'spawnColonyName': this.homeRoom.name};
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
        return this.homeRoom === undefined;
    }
}

module.exports = ColonyManager;