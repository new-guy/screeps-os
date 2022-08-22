const MultiCreep = require('MultiCreep');

class Swarm extends MultiCreep {
    constructor (...args) {
        super(...args);

        this.targetFlagName = this.memory.targetFlagName;
        this.rallyFlagName = '!RALLY|' + this.memory.colonyName;

        if(this.memory.state == null) {
            this.memory.state == 'spawning';
        }

        this.desiredCreeps = Array(this.memory.meleeCount).fill('ToughMelee');
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }


        if(this.memory.state === 'spawning') {
            this.ensureDesiredCreeps();
            this.waitingBehavior();
            if(this.hasDesiredCreeps()) {
                this.memory.state = 'fighting'
            }   
        }

        else {
            this.mainBehavior();
            if(this.getDesiredCreeps().length == 0) {
                this.memory.state = 'spawning'
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
        if(this.creepsAreSeparated(creeps)) {
            console.log('SEPARATED');
            this.uniteCreeps(creeps);
        }

        else {
            var targetFlag = Game.flags[this.targetFlagName];

            var lastCreep = creeps[creeps.length - 1];
            if(lastCreep.pos.roomName != targetFlag.pos.roomName) {
                this.moveCreepsTo(creeps, targetFlag.pos, true)
            }
            else {
                this.combatMove(creeps, targetFlag);
            }
        }
    }

    combatMove(creeps, targetFlag) {
        var enemyStructuresAtFlag = targetFlag.pos.getDestroyableStructures();

        if(enemyStructuresAtFlag.length > 0) {
            new RoomVisual(targetFlag.pos.roomName).circle(targetFlag.pos.x, targetFlag.pos.y, {opacity: 0.9, radius: 0.2, fill: '#ffcc00'});
            this.moveCreepsTo(creeps, targetFlag.pos, true);
        }

        else {
            var closestStructure = creeps[0].pos.getClosestDestroyableStructure();
            if(closestStructure === null) {
                creeps[0].say('NoTar');
                return;
            }
            this.moveCreepsTo(creeps, closestStructure.pos, true);
        }
    }

    fight(creeps, targetFlag) {
        //If targetFlag in range, prioritize targets there, otherwise just look for close targets
        //Healer just checks everyone and heals the most damaged creep
        var melees = this.getCreepsByType(creeps, 'Melee');

        for(var i = 0 ; i < melees.length; i++) {
            var melee = melees[i];
            this.meleeNearbyTargets(melee, targetFlag);
        }
    }

    meleeNearbyTargets(melee, targetFlag) {
        if(targetFlag.room != null && melee.pos.isNearTo(targetFlag.pos)) {
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

    moveCreepsTo(creeps, pos) {
        for(var i = 0; i < creeps.length; i++) {
            var creep = creeps[i];
            creep.moveTo(pos);
            follower.say('✌️');
        }
    }
    
    creepsAreSeparated(creeps) {
        var creepsAreSeparated = false;
        for(var i = 0; i < creeps.length-1; i++) {
            var creepOne = creeps[i];
            var creepTwo = creeps[i+1];
            var creepIsOnEdge = creepOne.pos.isEdge() || creepTwo.pos.isEdge();
            if(creepOne.pos.getRangeTo(creepTwo) > 1) {
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