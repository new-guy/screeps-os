const CreepProcess = require('CreepProcess');

class BootStrapper extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            var targetColonyName = this.creep.memory.targetColony;
            var targetRoomName = this.creep.memory.targetRoom;
            if(targetColonyName !== undefined) {
                this.mode = 'colony'
                this.targetColonyName = this.targetColonyName
                this.targetColony = Game.colonies[targetColonyName]
            }
            else if(targetRoomName !== undefined) {
                this.mode = 'room'
                this.targetRoomName = this.targetRoomName
                this.targetRoom = Game.rooms[targetRoomName]
            }
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
                this.creep.curse();
                this.creep.clearTarget();
            }
            else if(targetSource.energy === 0) {
                this.creep.curse();
                this.creep.clearTarget();
            }
            else {
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
        if(this.mode == 'room' && this.targetRoom === undefined) {
            this.creep.moveTo(new RoomPosition(24, 24, this.creep.memory.targetRoom));
            this.creep.say('NoVision');
            return;
        }

        else if(this.creep.room.controller !== undefined && this.creep.room.controller.needsSaving())
        {
            this.creep.say("SaveCont");
            this.creep.upgradeThisController(this.creep.room.controller);
            return;
        }


        var target = this.creep.getTarget();

        if(target === null) {
            this.determineTarget();
            target = this.creep.getTarget();
        }

        if(target instanceof StructureSpawn || target instanceof StructureExtension) {
            this.creep.putEnergyInTarget();
        }

        else if(target instanceof StructureTower) {
            this.creep.say('Tower');
            this.creep.putEnergyInTarget();
        }

        else if(target instanceof ConstructionSite) {
            this.creep.buildTarget();
        }

        else if(target instanceof StructureController) {
            this.creep.upgradeThisController(target);
        }
    }

    determineTarget() {
        //If the room is below energy capacity, find the closest spawn or extension
        //If there are any roads below 50%, repair them
        //If the room has any construction sites, build them
        
        this.creep.say('Determining');

        var workArea = this.mode === "room" ? this.targetRoom : this.targetColony;

        if(workArea.energyAvailable < workArea.energyCapacityAvailable && this.creep.hasEnergy) {
            var closestNonFullFactory = this.creep.pos.findClosestByPath(workArea.nonFullFactories);

            if(closestNonFullFactory !== null) {
                this.creep.setTarget(closestNonFullFactory);
            }
            else {
                var firstNonFullFactory = workArea.nonFullFactories[0];
                if(this.creep.room.name !== firstNonFullFactory.room.name) {
                    this.creep.moveToRoom(firstNonFullFactory.room.name)
                }
                else {
                    console.log("Error finding nonfull factory for " + this.creep.name);
                }
            }
        }

        else if(workArea.halfFullTowers !== undefined && workArea.halfFullTowers.length > 0) {
            var closestTower = this.creep.pos.findClosestByPath(workArea.halfFullTowers);

            if(closestTower !== null) {
                this.creep.setTarget(closestTower)
            }
            else {
                console.log("Error finding half full tower for " + this.creep.name);
            }
        }

        else if(workArea.constructionSites !== undefined && workArea.constructionSites.length > 0) {
            if(this.mode === 'colony') {
                this.creep.setTarget(workArea.roomMostNeedingBuilder.mostBuiltConstructionSite);
            }
            else if(this.mode === 'room') {
                this.creep.setTarget(workArea.mostBuiltConstructionSite);
            }
        }

        else { //Final thing to do is upgrade controller
            if(this.mode === 'colony') {
                this.creep.setTarget(workArea.controllerToUpgrade);
            }
            else if(this.mode === 'room') {
                this.creep.setTarget(workArea.controller);
            }
        }
    }
}

module.exports = BootStrapper;