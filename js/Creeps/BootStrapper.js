const CreepProcess = require('CreepProcess');

class BootStrapper extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.targetRoom = Game.rooms[this.creep.memory.targetRoom];
        }
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
        if(this.creep.memory.roomToExplore !== undefined) {
            var roomName = this.creep.memory.roomToExplore;
            if(Game.rooms[roomName] !== undefined && this.creep.room.name === roomName && !this.creep.pos.isEdge()) {
                this.creep.memory.roomToExplore = undefined;
            }

            else {
                var posToMoveTo = new RoomPosition(25,25,roomName);
                this.creep.moveTo(posToMoveTo);
                this.creep.say('Mv|' + roomName);
            }
        }

        else if(this.creep.hasTargetOfClass(Source)) {
            var targetSource = this.creep.getTarget();

            if(this.creep.pos.getRangeTo(targetSource) > 1 && !targetSource.pos.hasOpenAdjacentTile()) {
                this.creep.say('NoRoom');
                this.creep.clearTarget();
            }
            else if(targetSource.energy === 0) {
                this.creep.say('SrcEmpty');
                this.creep.clearTarget();
            }
            else {
                this.creep.say('HasSrc');
                this.creep.harvestFrom(targetSource);
            }
        }

        else {
            if(this.creep.hasTarget()) {
                this.creep.clearTarget();
            }

            var activeSources = this.spawningColony.activeSources;

            var nearestSource = this.creep.pos.multiRoomFindClosestByPath(activeSources);

            if(nearestSource !== null) {
                this.creep.setTarget(nearestSource);
                this.spawningColony.removeFromActiveSources(nearestSource);
            }

            else {
                this.creep.say('NoSrc');
            }
        }
    }

    work() {
        if(this.targetRoom === undefined) {
            this.creep.moveTo(new RoomPosition(24, 24, this.creep.memory.targetRoom));
            this.creep.say('NoVision');
            return;
        }

        else if(this.targetRoom.controller !== undefined && (this.targetRoom.controller.needsSaving() || this.creep.memory.savingRoom === true))
        {
            this.creep.say("SaveCont");
            this.creep.upgradeThisController(this.targetRoom.controller);
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

        if((target instanceof StructureSpawn || target instanceof StructureExtension) && this.creep.carry[RESOURCE_ENERGY] <= this.creep.carryCapacity/2) {
            this.creep.clearTarget();
        }

        if((target instanceof StructureSpawn || target instanceof StructureExtension) && this.creep.carry[RESOURCE_ENERGY] > this.creep.carryCapacity/2) {
            this.creep.say('Balance');
            this.creep.putEnergyInTarget();
        }

        else if(target instanceof StructureTower) {
            this.creep.say('Tower');
            this.creep.putEnergyInTarget();
        }

        else if(target instanceof ConstructionSite) {
            this.creep.buildTarget();
        }

        else {
            this.creep.say('Upgrade');
            this.creep.upgradeThisController(this.targetRoom.controller);
        }
    }

    determineTarget() {
        //If the room is below energy capacity, find the closest spawn or extension
        //If there are any roads below 50%, repair them
        //If the room has any construction sites, build them

        if(this.targetRoom.energyAvailable < this.targetRoom.energyCapacityAvailable && this.creep.carry[RESOURCE_ENERGY] > this.creep.carryCapacity/2) {
            var closestNonFullFactory = this.creep.pos.findClosestByPath(this.targetRoom.nonFullFactories);

            if(closestNonFullFactory !== null) {
                this.creep.setTarget(closestNonFullFactory);
            }
            else {
                console.log("Error finding nonfull factory for " + this.creep.name);
            }
        }

        else if(this.targetRoom.halfFullTowers.length > 0) {
            var closestTower = this.creep.pos.findClosestByPath(this.targetRoom.halfFullTowers);

            if(closestTower !== null) {
                this.creep.setTarget(closestTower)
            }
            else {
                console.log("Error finding half full tower for " + this.creep.name);
            }
        }

        else if(this.targetRoom.constructionSites !== undefined && this.targetRoom.constructionSites.length > 0) {
            this.creep.setTarget(this.targetRoom.mostBuiltConstructionSite);
        }
    }
}

module.exports = BootStrapper;