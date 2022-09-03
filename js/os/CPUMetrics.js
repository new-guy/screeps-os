var processStartTime = 0;
var processesFinished = 0;
var processesSlept = 0;
var processesSkipped = 0;
var processStats = {};

exports.init = function() {
    processStats = {};
    processesFinished = 0;
    processesSlept = 0;
    processesSkipped = 0;

    if(Memory.cpu == null) Memory.cpu = {};
}

exports.startProcess = function(processMetadata) {
    processStartTime = Game.cpu.getUsed();
}

exports.endProcess = function(processMetadata) {
    var processEndTime = Game.cpu.getUsed();
    processesFinished += 1;

    var processRunTime = processEndTime - processStartTime;
    var processClass = processMetadata['processClass'];

    if(processStats[processClass] == null) {
        processStats[processClass] = [processRunTime];
    }

    else {
        processStats[processClass].push(processRunTime);
    }
}

exports.sleepProcess = function(processMetadata) {
    processesSlept++;
}

exports.skipProcess = function(processMetadata) {
    processesSkipped++;
}

exports.getBucketState = getBucketState;
function getBucketState() {
    var bucketLevel = Game.cpu.bucket;

    if(bucketLevel > CPU_BUCKET_HIGH_WATERMARK) {
        return "high";
    }

    else if(bucketLevel > CPU_BUCKET_LOW_WATERMARK) {
        return "normal";
    }

    else  {
        return "low";
    }
}

exports.isPastSafeCPUUsage = function() {
    var bucketState = getBucketState();
    var cpuUsed = Game.cpu.getUsed();

    if(bucketState === "high") {
        return (cpuUsed/Game.cpu.tickLimit > CPU_ABOVE_HIGH_PERCENT);
    }

    else if(bucketState === "normal") {
        return (cpuUsed/Game.cpu.limit > CPU_DEFAULT_PERCENT);
    }

    else if(bucketState === "low") {
        return (cpuUsed/Game.cpu.limit > CPU_BELOW_LOW_PERCENT);
    }

    else {
        console.log('Unknown bucket state: ' + bucketState);
        return false;
    }
}

exports.printProcessStats = function(scheduler) {
    console.log("=======================");

    var totalUsedByProcesses = 0;

    for(var processClass in processStats) {
        var stats = processStats[processClass];
        var sum = _.sum(stats).toFixed(2);
        totalUsedByProcesses += _.sum(stats);

        var total = 0;
        for(var i = 0; i < stats.length; i++) {
            total += stats[i];
        }

        var mean = (total/stats.length).toFixed(2);
        console.log(processClass + " M: " + mean + " S: " + sum);
    }

    var totalUsed = Game.cpu.getUsed().toFixed(2);
    var overhead = (totalUsed - totalUsedByProcesses).toFixed(2);
    totalUsedByProcesses = totalUsedByProcesses.toFixed(2);

    console.log("==========");
    console.log("CPU Used: " + totalUsed + " Limit: " + Game.cpu.limit + " Tick Limit: " + Game.cpu.tickLimit);
    console.log("Overhead: " + overhead + " Process: " + totalUsedByProcesses);
    console.log("Bucket State: " + getBucketState() + " Level: " + Game.cpu.bucket);
    console.log("Ticks Since Not Full: " + getTicksSinceCPUNonFull());
    console.log("Processes Runnable: " + scheduler.sortedProcesses.length);
    console.log("Processes Finished: " + processesFinished + " Slept: " + processesSlept + " Skipped: " + processesSkipped);
    console.log("=======================");
    //Calculate average and total for each process class
}

exports.getTicksSinceCPUNonFull = getTicksSinceCPUNonFull;
function getTicksSinceCPUNonFull() {
    var bucketNotFull = Game.cpu.bucket < 10000;
    if(Memory.cpu.lastNonFullBucketTick == null || bucketNotFull) Memory.cpu.lastNonFullBucketTick = Game.time;

    var ticksSinceNonFull = Game.time - Memory.cpu.lastNonFullBucketTick;
    return ticksSinceNonFull;
}

exports.recordProcessMetrics = function(scheduler) {
    Memory.stats.processes = {};
    Memory.stats.processes.classes = {}
    var totalUsedByProcesses = 0;

    for(var processClass in processStats) {
        var stats = processStats[processClass];
        var sum = _.sum(stats).toFixed(2);
        totalUsedByProcesses += _.sum(stats);

        var total = 0;
        for(var i = 0; i < stats.length; i++) {
            total += stats[i];
        }

        var mean = (total/stats.length).toFixed(2);

        //Record the average, sum, and count
        Memory.stats.processes.classes[processClass] = {
            'mean': mean,
            'sum': sum,
            'count': stats.length
        }
    }

    var totalUsed = Game.cpu.getUsed().toFixed(2);
    var overhead = (totalUsed - totalUsedByProcesses).toFixed(2);
    totalUsedByProcesses = totalUsedByProcesses.toFixed(2);

    Memory.stats.processes.summary = {
        'overhead': overhead,
        'processCPU': totalUsedByProcesses,
        'runnable': scheduler.sortedProcesses.length,
        'finished': processesFinished,
        'slept': processesSlept,
        'skipped': processesSkipped
    }
    //Calculate average and total for each process class
}