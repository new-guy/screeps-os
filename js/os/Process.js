class Process {
    constructor (pid, scheduler) {
        //Take in a PID string as a constructor
        //Load Memory.processes[PID] into this.memory
        this.pid = pid;
        this.memory = Memory.processes[pid]['data'];
        this.scheduler = scheduler;
        this.ensuredChildren = [];
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

        if(this.memory.children !== undefined) {
            this.killNonEnsuredChildren();
        }

        if(this.processShouldDie()) {
            console.log('Exit ' + this.pid);
            return 'exit';
        }

        else {
            return 'continue';
        }
    }

    ensureChildProcess(pid, processClass, data, priority) {
        this.scheduler.ensureProcessExists(pid, processClass, data, priority);
        this.ensuredChildren.push(pid);

        if(this.memory.children === undefined) {
            this.memory.children = [];
        }

        if(!this.memory.children.includes(pid)) {
            this.memory.children.push(pid);
        }
    }

    removeChildProcess(pid) {
        _.remove(this.memory.children, function(proc) { return proc === pid; });
        this.scheduler.removeProcess(pid);
    }

    saveMemory() {
        Memory.processes[this.pid]['data'] = this.memory;
    }

    killNonEnsuredChildren() {
        //For each child, remove it if its pid is not in this.ensured
        var childrenToKill = [];

        for(var i = 0; i < this.memory.children.length; i++) {
            var childPID = this.memory.children[i];

            if(this.ensuredChildren.includes(childPID)) {
                console.log('Not killing child ' + childPID);
            }

            else {
                console.log('Would kill child ' + childPID);
                childrenToKill.push(childPID);
            }
        }

        for(var i = 0; i < childrenToKill.length; i++) {
            this.removeChildProcess(childrenToKill[i]);
        }
    }
}

module.exports = Process;