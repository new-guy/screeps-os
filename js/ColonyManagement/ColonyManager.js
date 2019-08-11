const Process = require('Process');

class ColonyManager extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        console.log('Colony ' + this.pid + ' HomeRoom: ' + this.memory.homeRoom);
    }
    //Need an update function

    finish() {
        Memory.processes[this.pid]['data'] = this.memory;

        console.log('Finish ' + this.pid);

        return 'continue';
    }
}

module.exports = ColonyManager;