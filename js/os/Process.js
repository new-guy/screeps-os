class Process {
    constructor (pid, scheduler) {
        //Take in a PID string as a constructor
        //Load Memory.processes[PID] into this.memory
        this.pid = pid;
        this.memory = Memory.processes[pid]['data'];
        this.metadata = Memory.processes[pid]['metadata'];
        this.scheduler = scheduler;
        this.ensuredChildren = [];
    }

    update() {
        if(this.processShouldDie()) {
            return 'exit';
        }
    }

    processShouldDie() {
        return false;
    }

    sleep(ticks) {
        var wakeTick = Game.time + ticks;

        this.metadata['wakeTick'] = wakeTick;
    }

    finish() {
        this.saveMemory();

        if(this.memory.children != null) {
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

        if(this.memory.children == null) {
            this.memory.children = [];
        }

        if(!this.memory.children.includes(pid)) {
            this.memory.children.push(pid);
        }
    }
    
    ensureChildByPid(pid) {
        this.ensuredChildren.push(pid);
    }

    removeChildProcess(pid) {
        var pidIndex = this.memory.children.indexOf(pid);

        if(pidIndex > -1) {
            this.memory.children.splice(pidIndex, 1);
        }

        this.scheduler.garbageCollectProcess(pid);
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
                // console.log('Not killing child ' + childPID);
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

    killAllChildren() {
        while(this.memory.children.length > 0) {
            var pid = this.memory.children.shift();
            this.scheduler.garbageCollectProcess(pid);
        }
    }
}

module.exports = Process;