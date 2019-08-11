class Process {
    constructor (pid, scheduler) {
        //Take in a PID string as a constructor
        //Load Memory.processes[PID] into this.memory
        this.pid = pid;
        this.memory = Memory.processes[pid]['data'];
        this.scheduler = scheduler;
    }

    update() {
        console.log('Update ' + this.pid);
        if(this.processShouldDie()) {
            return 'exit';
        }
    }

    processShouldDie() {
        return false;
    }

    finish() {
        this.saveMemory();

        if(this.processShouldDie()) {
            console.log('Exit ' + this.pid);
            return 'exit';
        }

        else {
            console.log('Continue ' + this.pid);
            return 'continue';
        }
    }

    ensureChildProcess(pid, processClass, data, priority) {
        this.scheduler.ensureProcessExists(pid, processClass, data, priority);

        if(this.memory.children === undefined) {
            this.memory.children = [];
        }

        if(!this.memory.children.includes(pid)) {
            this.memory.children.push(pid);
        }
    }

    saveMemory() {
        Memory.processes[this.pid]['data'] = this.memory;
    }
}

module.exports = Process;