const RoomManager = require('RoomManager');

var DOWNGRADE_TICKS_SAFEGUARD = 1000;

var MIN_ENERGY_TO_UPGRADE = 50000;
var ENERGY_PER_EXTRA_UPGRADER = 100000;

class HomeRoomManager extends RoomManager {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    
        if(this.room === undefined) {
            return 'continue';
        }

        if(this.room.towers.length > 0) {
            this.ensureChildProcess(this.name + '|towerManager', 'TowerManager', {'roomName': this.name}, COLONY_DEFENSE_PRIORITY);
        }
        //If we're pre-storage, bootstrap

        if(this.room.storage !== undefined) {
            this.ensureBalancers();
        }

        if(this.room.halfFullTowers.length > 0) {
            this.ensureTowerFillers();
        }

        if(this.room.controller.ticksToDowngrade < DOWNGRADE_TICKS_SAFEGUARD) {
            this.ensureDowngradeSafeguard();
        }

        if(this.room.storage !== undefined && this.room.state === 'default') {
            this.ensureDefaultUnits();
        }

        if(this.room.storage !== undefined || this.room.controller.level >= 5) {
            this.ensureDefenses();
        }

        if(this.room.links !== undefined && this.room.links > 0) {
            this.ensureLinkManagement();
        }
    }

    ensureBalancers() {
        var endFlags = this.room.find(FIND_FLAGS, {filter: function(flag) { 
            return flag.name.startsWith("!BALEND") }});
            
        for(var i = 0; i < endFlags.length; i++) {
            var endFlag = endFlags[i];
    
            this.createBalancerFor(endFlag);
        }
    }

    createBalancerFor(endFlag) {
        var startFlagName = endFlag.name.replace('BALEND', 'BALSTART');

        var startFlagName = startFlagName;
        var endFlagName = endFlag.name;

        var data = {
            'colonyName': this.colony.name,
            'creepCount': 1,
            'creepNameBase': 'balancer|' + endFlagName,
            'creepBodyType': 'Balancer',
            'creepProcessClass': 'Balancer',
            'creepMemory': {
                'targetRoom': endFlag.room.name,
                'startFlagName': startFlagName,
                'endFlagName': endFlagName
            },
            'creepPriority': COLONY_MANAGEMENT_PRIORITY,
            'maxEnergyToSpend': Math.max(300, this.room.energyAvailable)
        };
        
        var spawnPID = 'spawnBalancer|' + endFlagName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    ensureTowerFillers() {
        var data = {
            'colonyName': this.colony.name,
            'creepCount': 1,
            'creepNameBase': 'towerFiller|' + this.room.name,
            'creepBodyType': 'TowerFiller',
            'creepProcessClass': 'TowerFiller',
            'creepMemory': {
                'targetRoom': this.room.name
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };

        var spawnPID ='spawnTowerFiller|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, NECESSARY_CREEPS_PRIORITY);
    }

    ensureDowngradeSafeguard() {
        var bootstrappersToSpawn = 1;

        var data = {
            'targetRoomName': this.room.name,
            'spawnColonyName': this.colony.name,
            'maxToSpawn': bootstrappersToSpawn,
            'maxTicksToUse': 400,
            'maxEnergy': 300,
            'creepNameBase': 'downgradeSafeguard',
            'maxEnergyPerCreep': 300
        };
        
        var spawnPID = 'downgradeSafeguard|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'BootstrapSpawner', data, HIGHEST_PROMOTABLE_PRIORITY);
    }

    ensureDefaultUnits() {
        if(this.room.constructionSites.length > 0 || this.room.rampartsNeedingRepair.length > 0 || this.room.wallsNeedingRepair.length > 0) {
            this.ensureColonyBuilder();
        }

        this.ensureUpgraders();
        this.ensureUpgradeFeeders();
    }

    ensureColonyBuilder() {
        var data = {
            'colonyName': this.colony.name,
            'creepCount': 1,
            'creepNameBase': 'colonyBuilder|' + this.room.name,
            'creepBodyType': 'ColonyBuilder',
            'creepProcessClass': 'ColonyBuilder',
            'creepMemory': {
                'targetColony': this.colony.name
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };

        var spawnPID ='spawnColonyBuilder|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, NECESSARY_CREEPS_PRIORITY);
    }

    ensureUpgraders() {
        var energyInStorage = this.room.storage.store[RESOURCE_ENERGY];
        var upgraderCount = Math.max(1, Math.floor(energyInStorage/ENERGY_PER_EXTRA_UPGRADER));

        var data = {
            'colonyName': this.colony.name,
            'creepCount': upgraderCount,
            'creepNameBase': 'upgrader|' + this.room.name,
            'creepBodyType': 'Upgrader',
            'creepProcessClass': 'Upgrader',
            'creepMemory': {
                'targetRoom': this.room.name
            },
            'creepPriority': ROOM_UPGRADE_CREEPS_PRIORITY
        };

        var spawnPID ='spawnUpgraders|' + upgraderCount + '|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, ROOM_UPGRADE_CREEPS_PRIORITY);
    }

    ensureUpgradeFeeders() {
        var energyInStorage = this.room.storage.store[RESOURCE_ENERGY];
        var upgradeFeederCount = Math.max(1, Math.floor(energyInStorage/ENERGY_PER_EXTRA_UPGRADER));

        var data = {
            'colonyName': this.colony.name,
            'creepCount': upgradeFeederCount,
            'creepNameBase': 'upgraderFeeder|' + this.room.name,
            'creepBodyType': 'UpgradeFeeder',
            'creepProcessClass': 'UpgradeFeeder',
            'creepMemory': {
                'targetRoom': this.room.name
            },
            'creepPriority': ROOM_UPGRADE_CREEPS_PRIORITY
        };

        var spawnPID ='spawnUpgradeFeeders|' + upgradeFeederCount + '|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, ROOM_UPGRADE_CREEPS_PRIORITY);
    }

    ensureDefenses() {
        this.ensureChildProcess(this.name + '|defensePlanner', 'DefensePlanner', {'roomName': this.name}, COLONY_DEFENSE_PRIORITY);
    }

    ensureLinkManagement() {
        this.ensureChildProcess(this.name + '|linkFlagParser', 'LinkFlagParser', {'roomName': this.name}, COLONY_MANAGEMENT_PRIORITY);
        this.ensureChildProcess(this.name + '|linkManager', 'LinkManager', {'roomName': this.name}, COLONY_MANAGEMENT_PRIORITY);
    }
}

module.exports = HomeRoomManager;