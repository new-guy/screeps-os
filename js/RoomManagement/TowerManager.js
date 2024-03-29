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
    
        if(this.room == null) {
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

        else if(this.room.damagedRoads != null && this.room.damagedRoads.length > 0) {
            var mostDamaged = this.room.damagedRoads[0];

            for(var i = 1; i < this.room.damagedRoads.length; i++) {
                var road = this.room.damagedRoads[i];

                if(road.hits < mostDamaged.hits) {
                    mostDamaged = road;
                }
            }

            tower.repair(mostDamaged);
        }

        else if(this.room.rampartsNeedingRepair.length > 0) {
            var dangerousRampart = null;

            for(var i = 0; i < this.room.rampartsNeedingRepair.length; i++) {
                var rampart = this.room.rampartsNeedingRepair[i];

                if(rampart.hits < 5000) {
                    dangerousRampart = rampart;
                    break;
                }
            }

            tower.repair(dangerousRampart);
        }

        else if(this.room.containersNeedingRepair.length > 0) {
            var containerToRepair = this.room.containersNeedingRepair[0];

            tower.repair(containerToRepair);
        }
    }
}

module.exports = TowerManager;