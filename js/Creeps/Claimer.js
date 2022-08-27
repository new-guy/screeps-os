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
        var centerOfTargetRoom = new RoomPosition(25,25,this.creep.memory.targetRoom);

        if(targetRoom == null) {
            this.creep.moveTo(centerOfTargetRoom);
            Game.map.visual.line(centerOfTargetRoom, this.creep.pos, {color: '#9999ff', opacity: 0.7, width: 0.7, lineStyle: 'dotted'});
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
            Game.map.visual.line(targetController.pos, this.creep.pos, {color: '#9999ff', opacity: 0.7, width: 0.7, lineStyle: 'dotted'});
        }
    }
}

module.exports = Claimer;