const RoomManager = require('RoomManager');

class HomeRoomManager extends RoomManager {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    
        if(this.room == null) {
            return 'continue';
        }

        if(this.room.towers.length > 0) {
            this.ensureChildProcess(this.name + '|towerManager', 'TowerManager', {'roomName': this.name}, COLONY_DEFENSE_PRIORITY);
        }
        //If we're pre-storage, bootstrap

        if(this.room.harvestDestination != null) {
            this.ensureBalancers();
        }

        if(this.room.halfFullTowers.length > 0 && this.room.harvestDestination != null) {
            this.ensureTowerFillers();
        }

        if(this.room.controller.ticksToDowngrade < DOWNGRADE_TICKS_SAFEGUARD) {
            this.ensureDowngradeSafeguard();
        }

        if(this.room.harvestDestination != null && this.room.state === 'default') {
            this.ensureDefaultUnits();
        }

        if(this.room.controller.level >= 4) {
            this.ensureRampartPlanner();
        }

        if(this.room.storage == null) {
            this.preStorageBootstrap();
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

        var roundedEnergyAvailable = this.room.energyAvailable - (this.room.energyAvailable % 100);
        var energyToSpend = Math.max(300, roundedEnergyAvailable);

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
            'maxEnergyToSpend': energyToSpend
        };
        
        var spawnPID = 'spawnBalancer|' + energyToSpend + '|' + endFlagName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_BALANCER_PRIORITY);
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
            }
        };

        var spawnPID ='spawnTowerFiller|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_DEFENSE_PRIORITY);
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
        console.log('checking upgrade of ' + this.room.name)
        if(this.shouldUpgrade) {
            console.log(this.room.name + ' is trying to upgrade')
            this.ensureUpgraders();
            this.ensureUpgradeFeeders();
        }
    }

    get shouldUpgrade() {
        return this.room.hasNecessaryMinimumEnergy();
    }

    ensureUpgraders() {
        var energyInStorage = this.room.harvestDestination.store[RESOURCE_ENERGY];
        var upgraderCount = Math.max(1, Math.floor(energyInStorage/ENERGY_PER_EXTRA_UPGRADER));

        var harvestDest = this.room.harvestDestination;
        if(harvestDest.structureType === STRUCTURE_CONTAINER && harvestDest.store[RESOURCE_ENERGY] === harvestDest.store.getCapacity()) {
            upgraderCount = FULL_CONTAINER_UPGRADER_COUNT;
        }

        var data = {
            'colonyName': this.colony.name,
            'creepCount': upgraderCount,
            'creepNameBase': 'upgrader|' + this.room.name,
            'creepBodyType': 'Upgrader',
            'creepProcessClass': 'Upgrader',
            'creepMemory': {
                'targetRoom': this.room.name
            }
        };

        var spawnPID ='spawnUpgraders|' + upgraderCount + '|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, ROOM_UPGRADE_CREEPS_PRIORITY);
    }

    ensureUpgradeFeeders() {
        var energyInStorage = this.room.harvestDestination.store[RESOURCE_ENERGY];
        var upgradeFeederCount = Math.max(1, Math.floor(energyInStorage/ENERGY_PER_EXTRA_UPGRADER));

        var harvestDest = this.room.harvestDestination;
        if(harvestDest.structureType === STRUCTURE_CONTAINER && harvestDest.store[RESOURCE_ENERGY] === harvestDest.store.getCapacity()) {
            upgradeFeederCount = FULL_CONTAINER_UPGRADE_FEEDER_COUNT;
        }

        var data = {
            'colonyName': this.colony.name,
            'creepCount': upgradeFeederCount,
            'creepNameBase': 'upgraderFeeder|' + this.room.name,
            'creepBodyType': 'UpgradeFeeder',
            'creepProcessClass': 'UpgradeFeeder',
            'creepMemory': {
                'targetRoom': this.room.name
            }
        };

        var spawnPID ='spawnUpgradeFeeders|' + upgradeFeederCount + '|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, ROOM_UPGRADE_CREEPS_PRIORITY);
    }

    ensureRampartPlanner() {
        var data = {
            'roomName': this.room.name
        };
        
        var spawnPID = 'rampartPlanner|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'RampartPlanner', data, COLONY_MANAGEMENT_PRIORITY);
    }

    preStorageBootstrap() {
        var data = {
            'targetRoomName': this.room.name,
            'spawnColonyName': this.colony.name,
            'maxToSpawn': PRE_STORAGE_BOOTSTRAPPER_MAX,
            'maxTicksToUse': PRE_STORAGE_BOOTSTRAPPER_MAX_TICKS,
            'maxEnergy': PRE_STORAGE_BOOTSTRAPPER_MAX_ENERGY,
            'creepNameBase': this.room.name + '|PreStorBoot'
        };
        
        var spawnPID = 'PreStorBootSpawner|' + this.colony.name + '|' + this.room.name;
        this.ensureChildProcess(spawnPID, 'BootstrapSpawner', data, COLONY_EXPANSION_SUPPORT);
    }
}

module.exports = HomeRoomManager;