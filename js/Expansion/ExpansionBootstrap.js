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
            'maxToSpawn': EXPANSION_BOOTSTRAP_MAX_COUNT,
            'maxTicksToUse': EXPANSION_BOOTSTRAP_MAX_TICKS,
            'maxEnergy': EXPANSION_BOOTSTRAP_MAX_ENERGY,
            'creepNameBase': 'expansion'
        };
        
        var spawnPID = 'ExpansionBootstrapSpawner|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'BootstrapSpawner', data, COLONY_EXPANSION_SUPPORT);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = ExpansionBootstrap;