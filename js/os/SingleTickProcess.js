const Process = require('Process');

class SingleTickProcess extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }
    //Need an update function

    processShouldDie() {
        return false;
    }
}

module.exports = SingleTickProcess;