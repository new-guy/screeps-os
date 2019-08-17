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
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };
        
        var spawnPID = 'spawnBalancer|' + endFlagName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }
}

module.exports = HomeRoomManager;