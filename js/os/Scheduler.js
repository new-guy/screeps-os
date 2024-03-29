const Process = require('Process');
const SingleTickProcess = require('SingleTickProcess');
const SingleTickChildTest = require('SingleTickChildTest');
const RecursiveChildTest = require('RecursiveChildTest');

const EmpireManager = require('EmpireManager');

const ColonyManager = require('ColonyManager');
const ColonyScoutingManager = require('ColonyScoutingManager');
const SecondaryRoomFinder = require('SecondaryRoomFinder');
const RoadGenerator = require('RoadGenerator');
const RoadmapMakeRoad = require('RoadmapMakeRoad');
const EnergyHarvestingManager = require('EnergyHarvestingManager');
const EnergyRouteManager = require('EnergyRouteManager');
const MineralRouteManager = require('MineralRouteManager');
const InvaderMonitor = require('InvaderMonitor');
const ExpansionManager = require('ExpansionManager');
const OffenseMonitor = require('OffenseMonitor');

const HomeRoomManager = require('HomeRoomManager');
const ComaRecovery = require('ComaRecovery');
const TowerManager = require('TowerManager');
const LinkManager = require('LinkManager');
const HomeRoomConstructionMonitor = require('HomeRoomConstructionMonitor');
const RoomConstructionSiteManager = require('RoomConstructionSiteManager');
const RampartPlanner = require('RampartPlanner');

const SpawnCreep = require('SpawnCreep');
const BootstrapSpawner = require('BootstrapSpawner');

const Bobsled = require('Bobsled');
const Swarm = require('Swarm');

const MultiCreep = require('MultiCreep');
const CreepProcess = require('CreepProcess');
const BootStrapper = require('BootStrapper');
const Scout = require('Scout');
const Claimer = require('Claimer');
const Reserver = require('Reserver');
const Miner = require('Miner');
const Hauler = require('Hauler');
const ColonyHauler = require('ColonyHauler');
const RoomHauler = require('RoomHauler');
const Balancer = require('Balancer');
const ColonyBuilder = require('ColonyBuilder');
const RoadRepairer = require('RoadRepairer');
const Upgrader = require('Upgrader');
const UpgradeFeeder = require('UpgradeFeeder');
const TowerFiller = require('TowerFiller');
const InvaderDefender = require('InvaderDefender');
const WallMiner = require('WallMiner');

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
    "RoadGenerator": RoadGenerator,
    "RoadmapMakeRoad": RoadmapMakeRoad,
    "EnergyHarvestingManager": EnergyHarvestingManager,
    "EnergyRouteManager": EnergyRouteManager,
    "MineralRouteManager": MineralRouteManager,
    "ExpansionManager": ExpansionManager,
    "OffenseMonitor": OffenseMonitor,
    "HomeRoomManager": HomeRoomManager,
    "ComaRecovery": ComaRecovery,
    "TowerManager": TowerManager,
    "LinkManager": LinkManager,
    "HomeRoomConstructionMonitor": HomeRoomConstructionMonitor,
    "RoomConstructionSiteManager": RoomConstructionSiteManager,
    "SpawnCreep": SpawnCreep,
    "BootstrapSpawner" :BootstrapSpawner,
    "BootStrapper": BootStrapper,
    "Scout": Scout,
    "Claimer": Claimer,
    "Reserver": Reserver,
    "Miner": Miner,
    "Hauler": Hauler,
    "RoomHauler": RoomHauler,
    "ColonyHauler": ColonyHauler,
    "Balancer": Balancer,
    "ColonyBuilder": ColonyBuilder,
    "RoadRepairer": RoadRepairer,
    "Upgrader": Upgrader,
    "UpgradeFeeder": UpgradeFeeder,
    "TowerFiller": TowerFiller,
    "ExpansionBootstrap": ExpansionBootstrap,
    "RampartPlanner": RampartPlanner,
    "InvaderMonitor": InvaderMonitor,
    "InvaderDefender": InvaderDefender,
    "Bobsled": Bobsled,
    "MultiCreep": MultiCreep,
    "WallMiner": WallMiner,
    "Swarm": Swarm,
    "CreepProcess": CreepProcess
};

var MAX_PROCESSES_TO_DISPLAY = 10;

var DEBUGGING = true;

class Scheduler {
    constructor () {
        if( Memory.processes == null || 
            Memory.ipc == null) {

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
            // console.log("#PC: " + this.programCounter + " | " + activeProcessMetadata['pid']);

            if(this.processesBeingRemoved.includes(activeProcessMetadata['pid'])) {
                console.log('#Skipping because removal ' + activeProcessMetadata['pid']);
            }

            else if(!(processClass in processTypeMap)) {
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

        CPUMetrics.recordProcessMetrics(this);
        CPUMetrics.printProcessStats(this);

        if(CPUMetrics.getTicksSinceCPUNonFull() > CPU_TICKS_SINCE_NOT_FULL_TO_GENERATE_PIXEL) {
            Game.cpu.generatePixel();
        }

        function shouldSleep(processMetadata) {
            return processMetadata['wakeTick'] != null && processMetadata['wakeTick'] > Game.time; //Are we before the wake tick?
        }
    }

    executeProcess(processClass, activeProcessMetadata) {
        var activeProcess = new processTypeMap[processClass](activeProcessMetadata['pid'], this);
        activeProcess.update();
        var processResult = activeProcess.finish();

        if(processResult == 'exit') {
            this.garbageCollectProcess(activeProcessMetadata['pid']);
        }

        else {
            activeProcessMetadata['priority'] = activeProcessMetadata['defaultPriority'];
        }
    }

    getProcess(pid) {
        var processMemory = Memory.processes[pid];

        if(processMemory == null) {
            return null;
        }

        return new processTypeMap[processMemory['metadata']['processClass']](pid, this);
    }

    garbageCollect() {
        console.log('GC Start');
        for(var i = 0; i < this.processesBeingRemoved.length; i++) {
            var pid = this.processesBeingRemoved[i];
            Memory.processes[pid] = undefined; //Needs to be undefined in order to wipe the memory
            console.log('GC: ' + pid);
        }
    }

    shouldContinueProcessing() {
        return this.programCounter < this.sortedProcesses.length;
    }

    ensureProcessExists(pid, processClass, data, priority) {
        if(!this.processExists(pid)) {
            this.addProcessThisTick(pid, processClass, data, priority);
        }
    }

    processExists(pid) {
        return Memory.processes[pid] != null;
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

    garbageCollectProcess(pid) {
    //Recursively remove the process from memory, along with its child processes
        if(Memory.processes[pid] != null)
        {
            if(Memory.processes[pid]['data']['children'] != null) {
                for(var i = 0; i < Memory.processes[pid]['data']['children'].length; i++) {
                    var childProcessPid = Memory.processes[pid]['data']['children'][i];
                    this.garbageCollectProcess(childProcessPid);
                }
            }
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