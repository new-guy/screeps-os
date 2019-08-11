const Process = require('Process');

class SingleTickProcess extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        console.log('Update ' + this.pid);
    }
    //Need an update function

    finish() {
        Memory.processes[this.pid] = this.memory;

        console.log('Finish ' + this.pid);

        return 'exit';
    }
}

module.exports = SingleTickProcess;