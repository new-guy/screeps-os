const Process = require('Process');

class PreStorageBootstrap extends Process {
    constructor (...args) {
        super(...args);
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }


        // this.colony = Game.colonies[this.memory.colonyName];
        // this.creepName = this.memory.creepName;
        // this.creepBodyType = this.memory.creepBodyType;
        // this.creepProcessClass = this.memory.creepProcessClass;

        var data = {
            'colonyName': this.memory.spawnColonyName, 
            'creepName': 'bootstrapper|' + this.targetRoom.name,
            'creepBodyType': 'BootStrapper',
            'creepProcessClass': 'BootStrapper',
            'creepMemory': {
                'targetRoom': this.targetRoom.name
            },
            'creepPriority': NECESSARY_CREEPS_PRIORITY
        };
        var spawnPID = 'spawnPreStorBoot|' + this.memory.spawnColonyName + '|' + this.memory.targetRoomName;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);

        //All of the spawner processes that are created need to be children of this process
        //Ensure N processes for spawning bootstrapper creeps.  
            //It should be a generic SpawnCreep process that takes in the body of the creep and its data, then feeds that to a colony's spawn process
    }

    processShouldDie() {
        return (this.targetRoom.controller.level > 5 || this.targetRoom.storage !== undefined);
    }
}

module.exports = PreStorageBootstrap;