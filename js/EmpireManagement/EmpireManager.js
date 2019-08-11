const Process = require('Process');

class EmpireManager extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        console.log('Empire ' + this.pid);
    }
    //Need an update function

    finish() {
        Memory.processes[this.pid] = this.memory;

        console.log('Finish ' + this.pid);

        return 'continue';
    }
}

module.exports = EmpireManager;