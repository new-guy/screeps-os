const Process = require('Process');

class SingleTickChildTest extends Process {
    constructor (...args) {
        super(...args);

        for(var i = 0; i < 5; i++) {
            var pid = 'child|' + i;
            this.ensureChildProcess(pid, 'SingleTickProcess', {}, DEFAULT_PRIORITY);
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }
    //Need an update function

    processShouldDie() {
        return true;
    }
}

module.exports = SingleTickChildTest;