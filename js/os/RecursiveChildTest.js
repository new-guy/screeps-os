const Process = require('Process');

class RecursiveChildTest extends Process {
    constructor (...args) {
        super(...args);
    
    }

    update() {
        var pid = 'topLevelChild';
        this.ensureChildProcess(pid, 'SingleTickChildTest', {}, DEFAULT_PRIORITY);

        if(super.update() == 'exit') {
            return 'exit';
        }
    }
    //Need an update function

    processShouldDie() {
        if(this.memory.ticksAlive == null) this.memory.ticksAlive = 1;

        if(this.memory.ticksAlive > 5) return true;
        else {
            this.memory.ticksAlive++;
            return false;
        }
    }
}

module.exports = RecursiveChildTest;