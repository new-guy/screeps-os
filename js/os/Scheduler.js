class Scheduler {
    constructor () {
        if( Memory.processMetadata === undefined || 
            Memory.processes === undefined || 
            Memory.ipc === undefined) {

            Memory.processMetadata = {};
            Memory.processes = {};
            Memory.ipc = {};

            this.newProcess("empireman", "EmpireManager", {"test": "test"}, 1000)
            this.newProcess("test", "EmpireManager", {"test": "test"}, 235)
            this.newProcess("asdf", "EmpireManager", {"test": "test"}, 478)
            this.newProcess("twert", "EmpireManager", {"test": "test"}, 123)
            this.newProcess("urturt", "EmpireManager", {"test": "test"}, 6)
            this.newProcess("yhnrth", "EmpireManager", {"test": "test"}, 777)
        }

        this.sortedProcessMetadata = this.getSortedProcessMetadata();
        //First thing - create some processes with a temporary function and sort them, 
        //then draw that with roomvisuals
        console.log('sched');

        this.drawSortedProcesses('W7N4');
    }

    update () {
        console.log('update');
    }

    newProcess(pid, processClass, data, priority) {
        Memory.processMetadata[pid] = {
            "pid": pid,
            "priority": priority,
            "processClass": processClass
        };

        Memory.processes[pid] = data;
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