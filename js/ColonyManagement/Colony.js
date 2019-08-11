//Needs a "can spawn" function
//Needs a "spawn creep" function
    //Need some ability to prevent it from attempting to spawn multiple creeps from one spawner
//Needs a "homeroom" object

var bodyTypes = {
    "BootStrapper": [WORK, CARRY, MOVE, MOVE]
}

class Colony {
    /*
    this.homeRoom = Room
    this.rooms = {roomName: Room}

    this.availableSpawns = [];
    this.timeTillAvailableSpawn = 0;
    this.activeSources = [Source]
    this.depletedSources = [Source]
    */

    constructor(name) {
        this.name = name;
        this.memory = Memory.colonies[name];
        this.homeRoom = Game.rooms[this.memory['homeRoomName']];
        this.rooms = {}
        this.rooms[this.homeRoom.name] = this.homeRoom;
        this.initSpawnInfo();
        this.initMiningInfo();
    }

    initSpawnInfo() {
        var spawns = this.homeRoom.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_SPAWN }});

        this.availableSpawns = [];
        this.timeTillAvailableSpawn = 1000;
        //How long till we can spawn, how many can we spawn?
        for(var i = 0; i < spawns.length; i++) {
            var spawn = spawns[i];

            if(spawn.spawning === null) {
                this.timeTillAvailableSpawn = 0;
                this.availableSpawns.push(spawn);
            }

            else if (this.timeTillAvailableSpawn > spawn.spawning.remainingTime) {
                this.timeTillAvailableSpawn = spawn.spawning.remainingTime;
            }
        }
    }

    spawnIsAvailable() {
        return (this.availableSpawns.length > 0);
    }

    initMiningInfo() {
        this.activeSources = [];
        this.depletedSources = [];

        for(var roomName in this.rooms) {
            var room = this.rooms[roomName];
            var sourcesInRoom = room.find(FIND_SOURCES);

            for(var i = 0; i < sourcesInRoom.length; i++) {
                var source = sourcesInRoom[i];

                if(source.energy > 0) {
                    this.activeSources.push(source);
                }

                else {
                    this.depletedSources.push(source);
                }
            }
        }
    }

    spawnCreep(creepName, creepBodyType, creepProcessClass, creepMemory, creepPriority, scheduler) {
        var spawn = this.availableSpawns[0];

        if(spawn === undefined) {
            console.log('No spawn available for ' + this.homeRoom.name);
        }

        else {
            var body = bodyTypes[creepBodyType];
            //Try to spawn.  If we can, add the process to the scheduler.  If not, print why

            creepMemory['spawningColonyName'] = this.name;

            var spawnResult = spawn.spawnCreep(body, creepName, {memory: creepMemory});

            if(spawnResult === OK) {
                console.log('Spawning creep ' + creepName);

                var pid = 'creep|' + creepName;
                scheduler.addProcess(pid, creepProcessClass, {'creepName': creepName}, creepPriority);
                this.availableSpawns.shift();
            }

            else {
                console.log('Error spawning creep ' + spawnResult);
                console.log('Creep Dump: ' + creepName + ' ' + body);
            }
        }
    }
}

module.exports = Colony;