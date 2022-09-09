const Process = require('Process');

class CreepProcess extends Process {
    constructor (...args) {
        super(...args);

        this.creep = Game.creeps[this.memory.creepName];
        this.creepEmoji = '🤖'

        if(this.creep != null) {
            this.spawningColony = Game.colonies[this.creep.memory.spawningColonyName];
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.creep == null) {
            console.log(this.memory.creepName + ' is not defined');
        }

        else if(this.creep != null && this.creep.spawning) {
            console.log(this.creep.name + ' is spawning');
        }

        else {
            this.drawMapLocation();
            this.updateStateTransitions();
            this.performStateActions();
        }
    }

    drawMapLocation() {
	    Game.map.visual.text(this.creepEmoji, this.creep.pos, {color: '#CCCC22', fontSize: 4, align: 'center', opacity: 0.5});
        new RoomVisual(this.creep.room.name).text(this.creepEmoji, this.creep.pos, {color: '#CCCC22', fontSize: 2, align: 'center', opacity: 0.8});
    }

    updateStateTransitions() {
    }

    performStateActions() {

    }

    processShouldDie() {
        var myCreepExists = (this.creep != null);

        var shouldDie = !myCreepExists;
        if(shouldDie) {
            console.log('Killing process ' + this.pid + ' because creep does not exist');
        }

        return shouldDie;
    }
}

module.exports = CreepProcess;