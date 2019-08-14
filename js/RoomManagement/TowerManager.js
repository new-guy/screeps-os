const Process = require('Process');

class TowerManager extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    
        if(this.room === undefined) {
            return 'continue';
        }

        for(var i = 0; i < this.room.towers.length; i++) {
            this.updateTower(this.room.towers[i]);
        }
        //If we're pre-storage, bootstrap
    }

    updateTower(tower) {
        if(this.room.enemies.length > 0) {
            var closestEnemy = tower.pos.findClosestByRange(this.room.enemies);

            tower.attack(closestEnemy);
        }

        else if(this.room.damagedFriendlies.length > 0) {
            var closestFriendly = tower.pos.findClosestByRange(this.room.damagedFriendlies);

            tower.heal(closestFriendly);
        }

        else if(this.room.damagedRoads.length > 0) {
            var mostDamaged = _.minBy(this.room.damagedRoads, function(r) { return r.hits; });

            tower.repair(mostDamaged);
        }

        else if(this.room.rampartsNeedingRepair.length > 0) {
            var mostDamaged = _.minBy(this.room.rampartsNeedingRepair, function(r) { return r.hits; });

            tower.repair(mostDamaged);
        }
    }
}

module.exports = TowerManager;