const Process = require('Process');
const SingleTickProcess = require('SingleTickProcess');
const EmpireManager = require('EmpireManager');

var processTypeMap = {
    "Process": Process,
    "SingleTickProcess": SingleTickProcess,
    "EmpireManager": EmpireManager
};

class Scheduler {
    constructor () {
        if( Memory.processMetadata === undefined || 
            Memory.processes === undefined || 
            Memory.ipc === undefined) {

            Memory.processMetadata = {};
            Memory.processes = {};
            Memory.ipc = {};

            this.newProcess("empireman", "EmpireManager", {"test": "test"}, HIGHEST_PROMOTABLE_PRIORITY);
            this.newProcess("single", "SingleTickProcess", {"test": "test"}, HIGHEST_PROMOTABLE_PRIORITY);
        }

        this.sortedProcessMetadata = this.getSortedProcessMetadata();
        this.programCounter = 0;
        //First thing - create some processes with a temporary function and sort them, 
        //then draw that with roomvisuals
        console.log('sched');

        this.drawSortedProcesses('W7N4');
    }

    update () {
        //For each process, create a new object with that process type, update it, then finish it
        //If it finishes, remove its process metadata
        console.log('update');

        while(this.shouldContinueProcessing()) {
            var activeProcessMetadata = this.sortedProcessMetadata[this.programCounter];
            var processClass = activeProcessMetadata['processClass'];

            if(!processClass in processTypeMap) {
                console.log("Error: process class " + processClass + " does not exist");
            }

            else {
                var activeProcess = new processTypeMap[processClass](activeProcessMetadata['pid']);
        
                activeProcess.update();
                var processResult = activeProcess.finish();

                if(processResult == 'exit') {
                    this.removeProcess(activeProcessMetadata['pid']);
                }
            }

            this.programCounter += 1;
        }
    }

    shouldContinueProcessing() {
        console.log("#PC: " + this.programCounter);
        return this.programCounter < this.sortedProcessMetadata.length;
    }

    newProcess(pid, processClass, data, priority) {
        Memory.processMetadata[pid] = {
            "pid": pid,
            "priority": priority,
            "processClass": processClass
        };

        Memory.processes[pid] = data;
    }

    removeProcess(pid) {
        Memory.processMetadata[pid] = undefined;
        Memory.processes[pid] = undefined;
    }

    getSortedProcessMetadata() {
        var sortedProcessMetadata = [];

        sortedProcessMetadata = _.sortBy(Memory.processMetadata, function(p) { return p.priority });

        return sortedProcessMetadata.reverse(); //Was sorted ascending - needs to be descending
    }

    drawSortedProcesses(roomName) {
        var PROCESS_START_POS = {"x": 10, "y": 16};

        for(var i = 0; i < this.sortedProcessMetadata.length; i++) {
            var processMetadata = this.sortedProcessMetadata[i];
            var processPos = {"x": PROCESS_START_POS['x'], "y": PROCESS_START_POS['y'] + i}

            new RoomVisual(roomName).text(processMetadata['pid'] + "|" + processMetadata['priority'], processPos['x'], processPos['y']);
        }
    }
}

module.exports = Scheduler;