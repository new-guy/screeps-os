const Process = require('Process');

class ExpansionBootstrap extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.spawnBootstrappers();
    }

    spawnBootstrappers() {
        var data = {
            'targetRoomName': this.targetRoom.name,
            'spawnColonyName': this.spawnColony.name,
            'maxToSpawn': 5,
            'maxTicksToUse': 200,
            'maxEnergy': 5000,
            'creepNameBase': 'expansion'
        };
        
        var spawnPID = 'ExpansionBootstrapSpawner|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'BootstrapSpawner', data, COLONY_NONESSENTIAL_PRIORITY);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = ExpansionBootstrap;