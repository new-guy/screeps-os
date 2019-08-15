const CreepProcess = require('CreepProcess');

class Claimer extends CreepProcess {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    performStateActions() {
        var targetRoom = Game.rooms[this.creep.memory.targetRoom];
        this.creep.say('Claim');

        if(targetRoom === undefined) {
            var destination = new RoomPosition(25,25,this.creep.memory.targetRoom);

            this.creep.moveTo(destination);
        }

        else {
            if(this.creep.pos.getRangeTo(targetRoom.controller) > 1) {
                this.creep.moveTo(targetRoom.controller, {visualizePathStyle: {stroke: "#d0d", opacity: .5}});
            }
            
            else {
                this.creep.claim(targetRoom.controller);
            }
        }
    }
}

module.exports = Claimer;