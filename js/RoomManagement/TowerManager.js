const Process = require('Process');

class TowerManager extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    
        if(this.room === undefined) {
            return 'continue';
        }

        for(var i = 0; i < this.room.towers.length; i++) {
            this.updateTower(this.room.towers[i]);
        }
        //If we're pre-storage, bootstrap
    }

    updateTower() {
        //If there are any enemies, shoot the closest
            //Need to implement whitelist
        //If there are any unhealed creeps, heal them
            //Need to implement whitelist - heal friendly creeps
    }
}

module.exports = TowerManager;