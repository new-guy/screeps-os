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
        this.creep.say('🚩');

        if(targetRoom == null) {
            var destination = new RoomPosition(25,25,this.creep.memory.targetRoom);

            this.creep.moveTo(destination);
        }

        else {
            var targetController = targetRoom.controller;
            if(this.creep.pos.getRangeTo(targetController) > 1) {
                this.creep.moveTo(targetController, {maxRooms: 1, visualizePathStyle: {stroke: "#d0d", opacity: .5}});
            }
            
            else {
                if(targetController.owner != null && !targetController.my) {
                    this.creep.attackController(targetController);
                }
                else {
                    this.creep.claimController(targetController);
                }
            }
        }
    }
}

module.exports = Claimer;