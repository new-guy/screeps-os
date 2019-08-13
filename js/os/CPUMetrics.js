var BUCKET_LOW_WATERMARK = 2000;
var BUCKET_HIGH_WATERMARK = 8000;

var ABOVE_HIGH_PERCENT = 0.9;
var DEFAULT_PERCENT = 0.9;
var BELOW_LOW_PERCENT = 0.5;

var processStartTime = 0;
var processesFinished = 0;
var processStats = {};

exports.init = function() {
    processStats = {};
    processesFinished = 0;
}

exports.startProcess = function(processMetadata) {
    processStartTime = Game.cpu.getUsed();
}

exports.endProcess = function(processMetadata) {
    var processEndTime = Game.cpu.getUsed();
    processesFinished += 1;

    var processRunTime = processEndTime - processStartTime;
    var processClass = processMetadata['processClass'];

    if(processStats[processClass] === undefined) {
        processStats[processClass] = [processRunTime];
    }

    else {
        processStats[processClass].push(processRunTime);
    }
}

exports.getBucketState = getBucketState;
function getBucketState() {
    var bucketLevel = Game.cpu.bucket;

    if(bucketLevel > BUCKET_HIGH_WATERMARK) {
        return "high";
    }

    else if(bucketLevel > BUCKET_LOW_WATERMARK) {
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
        return (cpuUsed/Game.cpu.tickLimit > ABOVE_HIGH_PERCENT);
    }

    else if(bucketState === "normal") {
        return (cpuUsed/Game.cpu.limit > DEFAULT_PERCENT);
    }

    else if(bucketState === "low") {
        return (cpuUsed/Game.cpu.limit > BELOW_LOW_PERCENT);
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
    console.log("Processes Runnable: " + scheduler.sortedProcesses.length);
    console.log("Processes Finished: " + processesFinished);
    console.log("=======================");
    //Calculate average and total for each process class
}