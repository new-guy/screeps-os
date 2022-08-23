const MultiCreep = require('MultiCreep');

class Swarm extends MultiCreep {
    constructor (...args) {
        super(...args);

        this.targetFlagName = this.memory.targetFlagName;
        this.rallyFlagName = '!RALLY|' + this.memory.colonyName;

        if(this.memory.state == null) {
            this.memory.state = 'spawning';
        }

        this.desiredCreeps = [];

        for(var i = 0; i < this.memory.meleeCount; i++) {
            this.desiredCreeps.push('ToughMelee');
        }
    }

    update() {
        if(this.memory.state === 'spawning') {
            this.ensureDesiredCreeps();
            this.waitingBehavior();
            if(this.hasDesiredCreeps()) {
                this.memory.state = 'fighting'
            }   
        }

        else {
            if(this.getDesiredCreeps().length == 0) {
                this.memory.state = 'spawning'
            }
            else {
                this.mainBehavior();
            }
        }
    }

    waitingBehavior() {
        var rallyFlag = Game.flags[this.rallyFlagName];

        if(rallyFlag == null) {
            console.log('MISSING RALLY FLAG ' + this.rallyFlagName);
            return;
        }

        var creeps = this.getDesiredCreeps();

        for(var i = 0; i < creeps.length; i++) {
            var creep = creeps[i];
            if(creep.spawning) continue;
            creep.moveTo(rallyFlag.pos);
        }
    }

    mainBehavior() {
        var creeps = this.getDesiredCreeps();
        this.moveCreeps(creeps);

        var targetFlag = Game.flags[this.targetFlagName];
        this.fight(creeps, targetFlag);
    }

    moveCreeps(creeps) {
        var targetFlag = Game.flags[this.targetFlagName];
        var creepsInTargetRoom = [];
        var creepsOutsideTargetRoom = [];

        for(var i = 0; i < creeps.length; i++) {
            var creep = creeps[i]
            if(targetFlag != null && creep.pos.roomName === targetFlag.pos.roomName) {
                creepsInTargetRoom.push(creep);
            }
            else {
                creepsOutsideTargetRoom.push(creep)
            }
        }

        if(targetFlag != null) {
            this.moveCreepsTo(creepsOutsideTargetRoom, targetFlag.pos);
        }
        this.combatMove(creepsInTargetRoom, targetFlag);
    }

    combatMove(creeps, targetFlag) {
        if(targetFlag == null) {
            this.moveToClosestDestroyableStructure(creeps, targetFlag);
            return;
        }
        var enemyStructuresAtFlag = targetFlag.pos.getDestroyableStructures();

        if(enemyStructuresAtFlag.length > 0) {
            new RoomVisual(targetFlag.pos.roomName).circle(targetFlag.pos.x, targetFlag.pos.y, {opacity: 0.9, radius: 0.2, fill: '#aaffff'});
            this.moveCreepsTo(creeps, targetFlag.pos, true);
        }

        else {
            var attackingStructure = this.moveToClosestDestroyableStructure(creeps, targetFlag);
            if(!attackingStructure) {
                var attackingCreep = this.moveToClosestEnemyCreep(creeps);
                if(!attackingCreep) {
                    this.moveCreepsTo(creeps, targetFlag.pos, true);
                }
            }
        }
    }

    moveToClosestDestroyableStructure(creeps, targetFlag) {
        if(creeps.length === 0) return false;

        var closestStructure = creeps[0].pos.getClosestDestroyableStructure();
        if(closestStructure === null) {
            return false;
        }
        this.moveCreepsTo(creeps, closestStructure.pos, true);
        return true;
    }

    moveToClosestEnemyCreep(creeps) {
        var enemies = creeps[0].room.enemies;
        if(enemies == null || enemies.length === 0) {
            return false;
        }
        var closestEnemyCreep = creeps[0].pos.findClosestByPath(enemies);
        this.moveCreepsTo(creeps, closestEnemyCreep.pos, true);
        return true;
    }

    fight(creeps, targetFlag) {
        //If targetFlag in range, prioritize targets there, otherwise just look for close targets
        //Healer just checks everyone and heals the most damaged creep
        var melees = this.getCreepsByType(creeps, 'ToughMelee');

        for(var i = 0 ; i < melees.length; i++) {
            var melee = melees[i];
            this.meleeNearbyTargets(melee, targetFlag);
        }
    }

    meleeNearbyTargets(melee, targetFlag) {
        if(targetFlag != null && targetFlag.room != null && melee.pos.isNearTo(targetFlag.pos)) {
            var enemyStructuresAtFlag = targetFlag.pos.getDestroyableStructures();
            if(enemyStructuresAtFlag.length > 0) {
                melee.attack(enemyStructuresAtFlag[0]);
                melee.say('⚔️')
            }
            else {
                var nearbyEnemyClosestToDeath = melee.pos.getEnemyClosestToDeath();
                if(nearbyEnemyClosestToDeath != null) {
                    melee.attack(nearbyEnemyClosestToDeath);
                    melee.say('⚔️')
                }
            }
        }

        else {
            var nearbyEnemyClosestToDeath = melee.pos.getEnemyClosestToDeath();
            if(nearbyEnemyClosestToDeath != null) {
                melee.attack(nearbyEnemyClosestToDeath);
                melee.say('⚔️')
            }
        }
    }

    getCreepsByType(creeps, creepType) {
        var creepsByType = [];

        for(var i = 0; i < creeps.length; i++) {
            var creep = creeps[i];
            if(creep.name.includes(creepType)) {
                creepsByType.push(creep);
            }
        }

        return creepsByType;
    }

    moveCreepsTo(creeps, pos, combat=false) {
        for(var i = 0; i < creeps.length; i++) {
            var creep = creeps[i];
            if(combat) creep.meleeMoveTo(pos);
            else creep.moveTo(pos);
            creep.say('✌️', true);
        }
    }
    
    creepsAreSeparated(creeps) {
        var creepsAreSeparated = false;
        for(var i = 0; i < creeps.length-1; i++) {
            var creepOne = creeps[i];
            var creepTwo = creeps[i+1];
            var creepIsOnEdge = creepOne.pos.isEdge() || creepTwo.pos.isEdge();
            if(creepOne.pos.getRangeTo(creepTwo) > 3) {
                creepsAreSeparated = true;
            }

            if(creepIsOnEdge) return false;
        }

        return creepsAreSeparated;
    }

    uniteCreeps(creeps) {
        for(var i = 0; i < creeps.length-1; i++) {
            var creepOne = creeps[i];
            var creepTwo = creeps[i+1];
            if(creepOne.pos.getRangeTo(creepTwo) > 1) {
                creepTwo.moveTo(creepOne);
                creepOne.say('🚶')
            } else {
                creepOne.say('⌚')
            }
        }
    }
}

module.exports = Swarm;