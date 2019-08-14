const CreepProcess = require('CreepProcess');

class Scout extends CreepProcess {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    performStateActions() {
        var destination = new RoomPosition(25,25,this.creep.memory.targetRoom);

        this.creep.say('Scouting');

        if(Game.rooms[this.creep.memory.targetRoom] === undefined || this.creep.pos.getRangeTo(destination) > 5) {
            var movePath = this.creep.getSafePath(destination, 5);
            this.creep.say(this.creep.moveByPath(movePath));

            this.creep.room.visual.poly(movePath, {lineStyle: 'dashed'});
        }
    }
}

module.exports = Scout;