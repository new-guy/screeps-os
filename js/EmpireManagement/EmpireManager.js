const Process = require('Process');

class EmpireManager extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        for(var roomName in Game.colonies) {
            console.log('Colony ' + roomName);

            var pid = 'colman|' + roomName;
            this.scheduler.ensureProcessExists(pid, 'ColonyManager', {'homeRoom': roomName}, COLONY_MANAGEMENT_PRIORITY);
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = EmpireManager;