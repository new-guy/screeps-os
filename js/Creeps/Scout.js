const CreepProcess = require('CreepProcess');

class Scout extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '👁'
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    performStateActions() {
        var destination = new RoomPosition(25,25,this.creep.memory.targetRoom);

        this.creep.say('Scouting');

        if(this.creep.hits < this.creep.hitsMax) {
            Game.recon.recordRoomDanger(this.creep.memory.targetRoom, true)
        }

        if(Game.rooms[this.creep.memory.targetRoom] == null || this.creep.pos.getRangeTo(destination) > 5) {
            if(this.creep.room.enemies.length > 0) {
                var movePath = this.creep.getSafePath(destination, 15);

                if(this.movePath == null) {
                    this.creep.say('nopath');
                    this.sleep(50);
                }

                else {
                    this.creep.say(this.creep.moveByPath(movePath));
                }
            }

            else {
                this.creep.moveTo(destination);
            }

        }
    }
}

module.exports = Scout;