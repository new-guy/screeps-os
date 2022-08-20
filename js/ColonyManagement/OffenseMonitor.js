const Process = require('Process');

class OffenseMonitor extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
        
        var offenseFlags = this.colony.offenseFlags;

        for(var i = 0; i < offenseFlags.length; i++) {
            var flag = offenseFlags[i];
            this.handleOffenseFlag(flag);
        }
    }

    handleOffenseFlag(flag) {
        if(!flag.name.endsWith('Bobsled')) {
            console.log('ONLY BOBSLED COMBAT');
            return;
        }

        var data = {
            'colonyName': this.colony.name,
            'creepNameBase': 'bobsled|' + this.colony.name + '|' + flag.pos.roomName,
            'targetFlagName': flag.name
        };
        
        var spawnPID = 'bobsled|' + this.colony.name + '|' + flag.pos.roomName;
        this.ensureChildProcess(spawnPID, 'Bobsled', data, COLONY_OFFENSE_PRIORITY);
    }
}

module.exports = OffenseMonitor;