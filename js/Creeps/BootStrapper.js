const CreepProcess = require('CreepProcess');

class BootStrapper extends CreepProcess {
    constructor (...args) {
        super(...args);
    }

    updateStateTransitions() {
        var state = this.creep.memory.state;
        if(state == undefined) {
            state = 'mineEnergy';
        }

        if(state === 'mineEnergy') {
            if(this.creep.hasFullEnergy) {
                state = 'work'
                this.creep.clearTarget();
            }
        }

        else if(state === 'work') {
            if(this.creep.hasNoEnergy) {
                state = 'mineEnergy'
                this.creep.clearTarget();
            }
        }

        this.creep.memory.state = state;
    }

    performStateActions() {
        var state = this.creep.memory.state;
        if(state === 'mineEnergy') {
            this.mineEnergy();
        }

        else if(state === 'work') {
            this.work();
        }
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

    work() {
        var targetRoom = Game.rooms[this.creep.memory.targetRoom];

        if(targetRoom === undefined) {
            this.creep.moveTo(new RoomPosition(24, 24, this.creep.targetRoom));
            this.creep.say('NoVision');
            return;
        }

        else if(targetRoom.controller !== undefined && (targetRoom.controller.needsSaving() || this.creep.memory.savingRoom === true))
        {
            this.creep.say("SaveCont");
            this.creep.upgradeThisController(targetRoom.controller);
            return;
        }


        var target = this.creep.getTarget();

        if(target === null) {
            this.determineTarget();
            target = this.creep.getTarget();
        }

        //Need to get target.  If we have no target, we need to determine a target
        //Do work based upon the target's class

        //If target is an extension, fill it
        //If target is a road, repair it
        //If target is a building, build it
        //Else, upgrade the controller

        if(target instanceof StructureSpawn || target instanceof StructureExtension) {
            this.creep.say('Balance');
            this.creep.putEnergyInTarget();
        }

        else if(target instanceof ConstructionSite) {
            this.creep.buildTarget();
        }

        else {
            this.creep.say('Upgrade');
            this.creep.upgradeThisController(targetRoom.controller);
        }
    }

    determineTarget() {
        //If the room is below energy capacity, find the closest spawn or extension
        //If there are any roads below 50%, repair them
        //If the room has any construction sites, build them

        if(this.creep.room.energyAvailable < this.creep.room.energyCapacityAvailable) {
            var closestNonFullFactory = this.creep.pos.findClosestByPath(this.creep.room.nonFullFactories);

            if(closestNonFullFactory !== null) {
                this.creep.setTarget(closestNonFullFactory);
            }
            else {
                console.log("Error finding nonfull factory for " + this.creep.name);
            }
        }

        else if(this.creep.room.constructionSites.length > 0) {
            this.creep.setTarget(this.creep.room.mostBuiltConstructionSite);
        }
    }
}

module.exports = BootStrapper;