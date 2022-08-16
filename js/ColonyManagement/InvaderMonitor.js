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

        for(var roomName in this.colony.colonyRoomInfo) {
            var room = Game.rooms[roomName];
            if(room === undefined) continue;
            if(room.enemies === undefined) continue;
            var invaders = _.filter(Game.room[roomName].enemies, function(r) { 
                return r.owner.username === 'Invader' });

            if(invaders.length === 0) continue;
            else {
                this.ensureDefender();
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
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_BUILDER_PRIORITY);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = InvaderMonitor;