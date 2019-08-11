//Needs a "can spawn" function
//Needs a "spawn creep" function
    //Need some ability to prevent it from attempting to spawn multiple creeps from one spawner
//Needs a "homeroom" object

var bodyTypes = {
    "BootStrapper": [WORK, CARRY, MOVE, MOVE]
}

class Colony {
    constructor(data) {
        this.homeRoom = Game.rooms[data['homeRoomName']];

        this.initSpawnInfo();
    }

    initSpawnInfo() {
        var spawns = this.homeRoom.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_SPAWN }});

        this.availableSpawns = [];
        this.timeTillWeCanSpawn = 1000;
        //How long till we can spawn, how many can we spawn?
        for(var i = 0; i < spawns.length; i++) {
            var spawn = spawns[i];

            if(spawn.spawning === null) {
                this.timeTillWeCanSpawn = 0;
                this.availableSpawns.push(spawn);
            }

            else if (this.timeTillWeCanSpawn > spawn.spawning.remainingTime) {
                this.timeTillWeCanSpawn = spawn.spawning.remainingTime;
            }
        }
    }

    spawnIsAvailable() {
        return (this.availableSpawns.length > 0);
    }

    spawnCreep(creepName, creepBodyType, creepProcessClass, creepMemory, creepPriority, scheduler) {
        var spawn = this.availableSpawns[0];

        if(spawn === undefined) {
            console.log('No spawn available for ' + this.homeRoom.name);
        }

        else {
            var body = bodyTypes[creepBodyType];
            //Try to spawn.  If we can, add the process to the scheduler.  If not, print why
            var spawnResult = spawn.spawnCreep(body, creepName, {memory: creepMemory});

            if(spawnResult === OK) {
                console.log('Spawning creep ' + creepName);

                var pid = 'creep|' + creepName;
                scheduler.addProcess(pid, creepProcessClass, {'creepName': creepName}, creepPriority);
            }

            else {
                console.log('Error spawning creep ' + spawnResult);
                console.log('Creep Dump: ' + creepName + ' ' + body);
            }
        }
    }
}

module.exports = Colony;