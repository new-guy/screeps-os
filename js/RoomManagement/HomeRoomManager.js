const RoomManager = require('RoomManager');

var DOWNGRADE_TICKS_SAFEGUARD = 1000;

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

        if(this.room.controller.ticksToDowngrade < DOWNGRADE_TICKS_SAFEGUARD) {
            this.ensureDowngradeSafeguard();
        }

        if(this.room.storage !== undefined && !this.room.isInComa()) {
            this.ensureNormalUnits();
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
            'creepPriority': COLONY_MANAGEMENT_PRIORITY
        };
        
        var spawnPID = 'spawnBalancer|' + endFlagName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
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

    ensureNormalUnits() {
        if(this.room.constructionSites.length > 0 || this.room.rampartsNeedingRepair.length > 0) {
            this.ensureBuilder();
        }
    }

    ensureBuilder() {
        var data = {
            'colonyName': this.colony.name,
            'creepCount': 1,
            'creepNameBase': 'builder|' + this.room.name,
            'creepBodyType': 'Builder',
            'creepProcessClass': 'Builder',
            'creepMemory': {
                'targetRoom': this.room.name
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };

        var spawnPID ='spawnBuilder|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, NECESSARY_CREEPS_PRIORITY);
    }
}

module.exports = HomeRoomManager;