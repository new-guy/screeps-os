const CreepProcess = require('CreepProcess');

class Reserver extends CreepProcess {
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
        this.creep.say('Reserve');

        if(targetRoom == null) {
            var destination = new RoomPosition(25,25,this.creep.memory.targetRoom);

            this.creep.moveTo(destination);
        }

        else {
            if(this.creep.pos.getRangeTo(targetRoom.controller) > 1) {
                this.creep.moveTo(targetRoom.controller, {visualizePathStyle: {stroke: "#f2f", opacity: .5}});
            }
            
            else {
                this.creep.reserveController(targetRoom.controller);
            }
        }
    }
}

module.exports = Reserver;