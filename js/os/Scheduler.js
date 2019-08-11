const Process = require('Process');
const SingleTickProcess = require('SingleTickProcess');
const SingleTickChildTest = require('SingleTickChildTest');

const EmpireManager = require('EmpireManager');

const ColonyManager = require('ColonyManager');
const PreStorageBootstrap = require('PreStorageBootstrap');

var processTypeMap = {
    "Process": Process,
    "SingleTickProcess": SingleTickProcess,
    "EmpireManager": EmpireManager,
    "ColonyManager": ColonyManager,
    "PreStorageBootstrap": PreStorageBootstrap,
    "SingleTickChildTest": SingleTickChildTest
};

class Scheduler {
    constructor () {
        if( Memory.processes === undefined || 
            Memory.ipc === undefined) {

            Memory.processes = {};
            Memory.ipc = {};

            this.addProcess("empireman", "EmpireManager", {"test": "test"}, HIGHEST_PROMOTABLE_PRIORITY);
            this.addProcess("childTest", "SingleTickChildTest", {"test": "test"}, HIGHEST_PROMOTABLE_PRIORITY);
        }

        this.sortedProcesses = this.getSortedProcesses();
        this.programCounter = 0;
        this.processesBeingRemoved = [];

        //First thing - create some processes with a temporary function and sort them, 
        //then draw that with roomvisuals
        this.drawSortedProcesses('W7N4');
    }

    update () {
        //For each process, create a new object with that process type, update it, then finish it
        //If it finishes, remove its process metadata
        console.log('#sched');

        while(this.shouldContinueProcessing()) {
            var activeProcessMetadata = this.sortedProcesses[this.programCounter]['metadata'];
            var processClass = activeProcessMetadata['processClass'];

            if(this.processesBeingRemoved.includes(activeProcessMetadata['pid'])) {
                console.log('#Skipping because removal ' + activeProcessMetadata['pid']);
            }

            else if(!processClass in processTypeMap) {
                console.log("#Error: process class " + processClass + " does not exist");
            }

            else {
                var activeProcess = new processTypeMap[processClass](activeProcessMetadata['pid'], this);
        
                activeProcess.update();
                var processResult = activeProcess.finish();

                if(processResult == 'exit') {
                    this.removeProcess(activeProcessMetadata['pid']);
                }
            }

            this.programCounter += 1;
        }
    }

    garbageCollect() {
        for(var i = 0; i < this.processesBeingRemoved.length; i++) {
            var pid = this.processesBeingRemoved[i];
            Memory.processes[pid] = undefined
        }
    }

    shouldContinueProcessing() {
        console.log("#PC: " + this.programCounter);
        return this.programCounter < this.sortedProcesses.length;
    }

    ensureProcessExists(pid, processClass, data, priority) {
        //TODO: MAKE THIS WORK - check if the process exists.  If not, make it

        if(!this.processExists(pid)) {
            this.addProcessThisTick(pid, processClass, data, priority);
        }
    }

    processExists(pid) {
        return Memory.processes[pid] !== undefined;
    }

    addProcess(pid, processClass, data, priority) {
        Memory.processes[pid] = {
            "metadata": {
                "pid": pid,
                "priority": priority,
                "processClass": processClass
            },
            "data": data
        };
    }

    addProcessThisTick(pid, processClass, data, priority) {
        this.addProcess(pid, processClass, data, priority);
        this.insertNewProcess(Memory.processes[pid]);
    }

    insertNewProcess(newProcessData) {
        for(var i = 0; i < this.sortedProcesses.length; i++) {
            var processMetadata = this.sortedProcesses[i]['metadata'];

            if(processMetadata.priority > newProcessData['metadata'].priority) {
                this.sortedProcesses.splice(1, 0, newProcessData);
                break;
            }
        }
    }

    removeProcess(pid) {
    //Recursively remove the process from memory, along with its child processes
        if(Memory.processes[pid] !== undefined)
        {
            if(Memory.processes[pid]['children'] !== undefined) {
                for(var i = 0; i < Memory.processes[pid]['children'].length; i++) {
                    this.removeProcess(Memory.processes[pid]['children'][i]);
                }
            }

            console.log('removing process ' + pid);
    
            Memory.processes[pid] = undefined;
        }

        this.processesBeingRemoved.push(pid);
    }

    getSortedProcesses() {
        var sortedProcesses = [];

        sortedProcesses = _.sortBy(Memory.processes, function(p) { return p['metadata'].priority });

        return sortedProcesses.reverse(); //Was sorted ascending - needs to be descending
    }

    drawSortedProcesses(roomName) {
        var PROCESS_START_POS = {"x": 10, "y": 16};

        for(var i = 0; i < this.sortedProcesses.length; i++) {
            var processMetadata = this.sortedProcesses[i]['metadata'];
            var processPos = {"x": PROCESS_START_POS['x'], "y": PROCESS_START_POS['y'] + i}

            new RoomVisual(roomName).text(processMetadata['pid'] + "|" + processMetadata['priority'], processPos['x'], processPos['y']);
        }
    }
}

module.exports = Scheduler;