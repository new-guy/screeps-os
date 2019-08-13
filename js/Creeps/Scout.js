const CreepProcess = require('CreepProcess');

class Scout extends CreepProcess {
    constructor (...args) {
        super(...args);

        this.creep = Game.creeps[this.memory.creepName];

        if(this.creep !== undefined) {
            this.spawningColony = Game.colonies[this.creep.memory.spawningColonyName];
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    performStateActions() {
        var destination = new RoomPosition(25,25,this.creep.memory.targetRoom);

        this.creep.say('Scouting');

        if(this.creep.pos.getRangeTo(destination) > 5) {
            this.creep.moveTo(destination);
        }
    }
}

module.exports = Scout;