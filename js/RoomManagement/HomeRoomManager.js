const RoomManager = require('RoomManager');

class HomeRoomManager extends RoomManager {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    
        if(this.room === undefined) {
            return 'continue';
        }

        if(this.room.towers.length > 0) {
            this.ensureChildProcess(this.name + '|towerManager', 'TowerManager', {'roomName': this.name}, COLONY_DEFENSE_PRIORITY);
        }
        //If we're pre-storage, bootstrap
    }
}

module.exports = HomeRoomManager;