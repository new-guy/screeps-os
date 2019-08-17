const Process = require('Process');

class SingleTickChildTest extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        var pid = 'child';
        this.ensureChildProcess(pid, 'SingleTickProcess', {}, DEFAULT_PRIORITY);

        if(super.update() == 'exit') {
            return 'exit';
        }
    }
    //Need an update function

    processShouldDie() {
        return false;
    }
}

module.exports = SingleTickChildTest;