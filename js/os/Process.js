class Process {
    constructor (pid) {
        //Take in a PID string as a constructor
        //Load Memory.processes[PID] into this.memory
        this.pid = pid;
        this.memory = Memory.processes[pid];
    }

    update() {
        console.log('Update ' + this.pid);
    }
    //Need an update function

    finish() {
        Memory.processes[this.pid] = this.memory;

        console.log('Finish ' + this.pid);

        return 'continue';
    }
    //Need a finish function that 
        //saves its this.memory object to Memory.processes[PID]
        //Returns whether 
}

module.exports = Process;