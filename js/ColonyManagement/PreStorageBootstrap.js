const Process = require('Process');

class PreStorageBootstrap extends Process {
    constructor (...args) {
        super(...args);

        console.log('printing stuff about this process');
        
        this.targetRoom = Game.rooms[this.memory.targetRoomName];
        this.spawnColony = Game.colonies[this.memory.spawnColonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        //All of the spawner processes that are created need to be children of this process - store that info in the child process.
    }

    processShouldDie() {
        return (this.targetRoom.controller.level > 5 || this.targetRoom.storage !== undefined);
    }
}

module.exports = PreStorageBootstrap;