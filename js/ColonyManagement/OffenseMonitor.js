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
        var flagInfoArray = flag.name.split('|');
        //0 - offense
        //1 - spawn colony
        //2 - unit type
        //3 - count
        var unitType = flagInfoArray[2];
        var unitCount = flagInfoArray[3];
        if(unitType === 'bobsled') {
            var data = {
                'colonyName': this.colony.name,
                'creepNameBase': 'bobsled|' + this.colony.name,
                'targetFlagName': flag.name
            };
            
            var spawnPID = 'bobsled|' + this.colony.name + '|' + unitCount;
            this.ensureChildProcess(spawnPID, 'Bobsled', data, COLONY_OFFENSE_PRIORITY);
        }

        if(unitType === 'swarm') {
            var data = {
                'colonyName': this.colony.name,
                'creepNameBase': 'swarm|' + this.colony.name,
                'targetFlagName': flag.name,
                'meleeCount': unitCount
            };
            
            var spawnPID = 'swarm|' + this.colony.name + '|' + unitCount;
            this.ensureChildProcess(spawnPID, 'Swarm', data, COLONY_OFFENSE_PRIORITY);
        }
    }
}

module.exports = OffenseMonitor;