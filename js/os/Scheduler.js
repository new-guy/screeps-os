const Process = require('Process');
const SingleTickProcess = require('SingleTickProcess');
const SingleTickChildTest = require('SingleTickChildTest');
const RecursiveChildTest = require('RecursiveChildTest');

const EmpireManager = require('EmpireManager');

const ColonyManager = require('ColonyManager');
const ColonyScoutingManager = require('ColonyScoutingManager');
const SecondaryRoomFinder = require('SecondaryRoomFinder');
const PreStorageSelfBootstrap = require('PreStorageSelfBootstrap');
const EnergyHarvestingManager = require('EnergyHarvestingManager');
const EnergyRouteManager = require('EnergyRouteManager');

const HomeRoomManager = require('HomeRoomManager');
const ComaRecovery = require('ComaRecovery');
const TowerManager = require('TowerManager');
const HomeRoomConstructionMonitor = require('HomeRoomConstructionMonitor');
const PlanningConstructionFlagMonitor = require('PlanningConstructionFlagMonitor');
const DefensePlanner = require('DefensePlanner');

const SpawnCreep = require('SpawnCreep');
const BootstrapSpawner = require('BootstrapSpawner');

const BootStrapper = require('BootStrapper');
const Scout = require('Scout');
const Claimer = require('Claimer');
const Reserver = require('Reserver');
const Miner = require('Miner');
const Hauler = require('Hauler');
const Balancer = require('Balancer');
const Builder = require('Builder');
const Upgrader = require('Upgrader');
const UpgradeFeeder = require('UpgradeFeeder');
const TowerFiller = require('TowerFiller');

const ExpansionBootstrap = require('ExpansionBootstrap');

const CPUMetrics = require('CPUMetrics');

var processTypeMap = {
    "Process": Process,
    "SingleTickProcess": SingleTickProcess,
    "SingleTickChildTest": SingleTickChildTest,
    "RecursiveChildTest": RecursiveChildTest,
    "EmpireManager": EmpireManager,
    "ColonyManager": ColonyManager,
    "ColonyScoutingManager": ColonyScoutingManager,
    "SecondaryRoomFinder": SecondaryRoomFinder,
    "PreStorageSelfBootstrap": PreStorageSelfBootstrap,
    "EnergyHarvestingManager": EnergyHarvestingManager,
    "EnergyRouteManager": EnergyRouteManager,
    "HomeRoomManager": HomeRoomManager,
    "ComaRecovery": ComaRecovery,
    "TowerManager": TowerManager,
    "HomeRoomConstructionMonitor": HomeRoomConstructionMonitor,
    "PlanningConstructionFlagMonitor": PlanningConstructionFlagMonitor,
    "DefensePlanner": DefensePlanner,
    "SpawnCreep": SpawnCreep,
    "BootstrapSpawner" :BootstrapSpawner,
    "BootStrapper": BootStrapper,
    "Scout": Scout,
    "Claimer": Claimer,
    "Reserver": Reserver,
    "Miner": Miner,
    "Hauler": Hauler,
    "Balancer": Balancer,
    "Builder": Builder,
    "Upgrader": Upgrader,
    "UpgradeFeeder": UpgradeFeeder,
    "TowerFiller": TowerFiller,
    "ExpansionBootstrap": ExpansionBootstrap
};

var MAX_PROCESSES_TO_DISPLAY = 10;

var DEBUGGING = true;

class Scheduler {
    constructor () {
        if( Memory.processes === undefined || 
            Memory.ipc === undefined) {

            Memory.processes = {};
            Memory.ipc = {};

            this.addProcess("empireman", "EmpireManager", {"test": "test"}, HIGHEST_PROMOTABLE_PRIORITY);
            this.addProcess("recursiveChildTest", "RecursiveChildTest", {"test": "test"}, HIGHEST_PROMOTABLE_PRIORITY);
        }

        this.sortedProcesses = this.getSortedProcesses();
        this.programCounter = 0;
        this.processesBeingRemoved = [];

        //First thing - create some processes with a temporary function and sort them, 
        //then draw that with roomvisuals

        
        //this.drawSortedProcesses('W2N3');
    }

    update () {
        //For each process, create a new object with that process type, update it, then finish it
        //If it finishes, remove its process metadata
        console.log('#######sched');

        CPUMetrics.init();

        while(this.shouldContinueProcessing()) {
            var activeProcessMetadata = this.sortedProcesses[this.programCounter]['metadata'];
            var processClass = activeProcessMetadata['processClass'];
            console.log("#PC: " + this.programCounter + " | " + activeProcessMetadata['pid']);

            if(this.processesBeingRemoved.includes(activeProcessMetadata['pid'])) {
                console.log('#Skipping because removal ' + activeProcessMetadata['pid']);
            }

            else if(!processClass in processTypeMap) {
                console.log("#Error: process class " + processClass + " does not exist");
            }

            else {
                if(shouldSleep(activeProcessMetadata)) {

                    CPUMetrics.sleepProcess(activeProcessMetadata);
                }

                else if(CPUMetrics.isPastSafeCPUUsage()) {
                    activeProcessMetadata['priority'] += 1;
                    CPUMetrics.skipProcess(activeProcessMetadata);
                }

                else {
                    CPUMetrics.startProcess(activeProcessMetadata);
            
                    if(DEBUGGING) {
                        this.executeProcess(processClass, activeProcessMetadata);
                    }
                    else {
                        try {
                            this.executeProcess(processClass, activeProcessMetadata);
                        } 
                        catch (error) {
                            console.log('!!!!!Error running ' + activeProcessMetadata['pid']);
                            console.log(error);
                        }
                    }
    
                    CPUMetrics.endProcess(activeProcessMetadata);
                }
            }

            this.programCounter += 1;
        }

        CPUMetrics.printProcessStats(this);

        function shouldSleep(processMetadata) {
            return processMetadata['wakeTick'] !== undefined && processMetadata['wakeTick'] > Game.time; //Are we before the wake tick?
        }
    }

    executeProcess(processClass, activeProcessMetadata) {
        var activeProcess = new processTypeMap[processClass](activeProcessMetadata['pid'], this);
        activeProcess.update();
        var processResult = activeProcess.finish();

        if(processResult == 'exit') {
            this.removeProcess(activeProcessMetadata['pid']);
        }

        else {
            activeProcessMetadata['priority'] = activeProcessMetadata['defaultPriority'];
        }
    }

    getProcess(pid) {
        var processMemory = Memory.processes[pid];

        if(processMemory === undefined) {
            return undefined;
        }

        return new processTypeMap[processMemory['metadata']['processClass']](pid, this);
    }

    garbageCollect() {
        console.log('GC Start');
        for(var i = 0; i < this.processesBeingRemoved.length; i++) {
            var pid = this.processesBeingRemoved[i];
            Memory.processes[pid] = undefined;
            console.log('GC: ' + pid);
        }
    }

    shouldContinueProcessing() {
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
                "defaultPriority": priority,
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

                if(i <= this.programCounter) {
                    this.programCounter += 1;
                }
                break;
            }
        }
    }

    removeProcess(pid) {
    //Recursively remove the process from memory, along with its child processes
        if(Memory.processes[pid] !== undefined)
        {
            if(Memory.processes[pid]['data']['children'] !== undefined) {
                for(var i = 0; i < Memory.processes[pid]['data']['children'].length; i++) {
                    var childProcessPid = Memory.processes[pid]['data']['children'][i];
                    this.removeProcess(childProcessPid);
                }
            }
    
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

        for(var i = 0; i < Math.min(MAX_PROCESSES_TO_DISPLAY, this.sortedProcesses.length); i++) {
            var processMetadata = this.sortedProcesses[i]['metadata'];
            var processPos = {"x": PROCESS_START_POS['x'], "y": PROCESS_START_POS['y'] + i}

            new RoomVisual(roomName).text(processMetadata['pid'] + "|" + processMetadata['priority'], processPos['x'], processPos['y']);
        }
    }
}

module.exports = Scheduler;