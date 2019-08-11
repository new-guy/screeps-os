const Process = require('Process');

class EmpireManager extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        console.log('Empire ' + this.pid);

        for(var roomName in Game.empire.colonies) {
            console.log('Colony ' + roomName);

            var pid = 'colman|' + roomName;
            this.scheduler.ensureProcessExists(pid, 'ColonyManager', {'homeRoom': roomName}, COLONY_MANAGEMENT_PRIORITY);
        }
    }
    //Need an update function

    finish() {
        Memory.processes[this.pid]['data'] = this.memory;

        console.log('Finish ' + this.pid);

        return 'continue';
    }
}

module.exports = EmpireManager;