const CreepProcess = require('CreepProcess');

class BootStrapper extends CreepProcess {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.creep.hasFullEnergy) {
            this.creep.say('Ready');
        }

        else {
            this.creep.say('NeedEng');

            this.mineEnergy();
        }
        //If no energy
            //Go mining
        //If energy
            //Save the controller <- allow this to override current targets

            //Unless no target
                //Fill Extensions
                //Build Stuff
                //
    }

    mineEnergy() {
        if(this.creep.hasTargetOfClass(Source)) {
            this.creep.say('HasSrc');

            var targetSource = this.creep.getTarget();

            this.creep.harvestFrom(targetSource);
        }

        else {
            if(this.creep.hasTarget()) {
                this.creep.clearTarget();
            }

            var activeSources = this.spawningColony.activeSources;

            var nearestSource = this.creep.pos.findClosestByPath(activeSources);

            if(nearestSource !== null) {
                this.creep.setTarget(nearestSource);
            }

            else {
                this.creep.say('NoSrc');
            }
        }
    }
}

module.exports = BootStrapper;