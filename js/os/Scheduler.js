class Scheduler {
    constructor () {
        if( Memory.processMetadata === undefined || 
            Memory.processes === undefined || 
            Memory.ipc === undefined) {

            Memory.processMetadata = {};
            Memory.processes = {};
            Memory.ipc = {};
        }

        //First thing - create some processes with a temporary function and sort them, 
        //then draw that with roomvisuals
        console.log('sched');
    }

    update () {
        console.log('update');
    }
}

module.exports = Scheduler;