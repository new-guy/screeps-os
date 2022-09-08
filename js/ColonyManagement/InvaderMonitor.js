const Process = require('Process');

class InvaderMonitor extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
        this.checkForInvaders();
        this.checkForLoneInvaderCores();
        this.checkForEnemies();
    }

    checkForInvaders() {
        for(var roomName in this.colony.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            if(room == null) continue;
            if(room.enemies == null) continue;
            if(room.isSkRoom) continue;
            var invaders = _.filter(Game.rooms[roomName].enemies, function(r) { 
                return r.owner.username === 'Invader' });

            if(invaders.length > 0 && !room.hasInvaderBase()) {
                this.ensureDefender();
                console.log("Detected invader in " + roomName + " - ensuring defense")
            }
        }
    }

    checkForLoneInvaderCores() {
        for(var roomName in this.colony.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            if(room == null) continue;
            if(room.isSkRoom) continue;

            if(room.hasLoneInvaderCore()) {
                this.ensureDefender();
                console.log("Detected invader core in " + roomName + " - ensuring defense")
            }
        }
    }

    checkForEnemies() {
        for(var roomName in this.colony.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            if(room == null) continue;
            if(room.isSkRoom) continue;

            if(room.enemies.length > 0) {
                this.ensureDefender();
                console.log("Detected enemies in " + roomName + " - ensuring defense")
            }
        }
    }

    ensureDefender() {
        var data = {
            'colonyName': this.colony.name,
            'creepCount': 1,
            'creepNameBase': 'invaderDefender|' + this.colony.name,
            'creepBodyType': 'InvaderDefender',
            'creepProcessClass': 'InvaderDefender',
            'creepMemory': {
                'targetColony': this.colony.name
            }
        };

        var spawnPID ='spawnInvaderDefender|' + this.colony.name;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_DEFENSE_PRIORITY);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = InvaderMonitor;