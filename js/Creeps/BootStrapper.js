const CreepProcess = require('CreepProcess');

class BootStrapper extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep != null) {
            var targetColonyName = this.creep.memory.targetColony;
            var targetRoomName = this.creep.memory.targetRoom;
            if(targetColonyName != null) {
                this.mode = 'colony'
                this.targetColonyName = this.targetColonyName
                this.targetColony = Game.colonies[targetColonyName]
            }
            else if(targetRoomName != null) {
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
        if(this.creep.memory.roomToExplore != null) {
            var roomName = this.creep.memory.roomToExplore;
            if(Game.rooms[roomName] != null && this.creep.room.name === roomName && !this.creep.pos.isEdge()) {
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

            if(nearestSource != null) {
                this.creep.setTarget(nearestSource);
                this.spawningColony.removeFromActiveSources(nearestSource);
            }

            else {
                this.creep.say('❎');

                if(this.creep.hasEnergy) {
                    this.creep.memory.state = 'work'
                }
            }
        }
    }

    work() {
        if(this.mode == 'room' && this.targetRoom == null) {
            this.creep.moveTo(new RoomPosition(24, 24, this.creep.memory.targetRoom));
            this.creep.say('🙈');
            return;
        }

        else if(this.creep.room.controller != null && this.creep.room.controller.needsSaving())
        {
            this.creep.say("SaveCont");
            this.creep.upgradeThisController(this.creep.room.controller);
            this.creep.setTarget(this.creep.room.controller);
            return;
        }


        var target = this.creep.getTarget();

        if(target == null) {
            this.determineTarget();
            target = this.creep.getTarget();
        }

        if(target instanceof StructureSpawn || target instanceof StructureExtension || target instanceof StructureStorage) {
            this.creep.putEnergyInTarget();
            if(!this.creep.hasTarget() && this.creep.room.energyAvailable === this.creep.room.energyCapacityAvailable) {
                if(this.creep.room.constructionSites != null && this.creep.room.constructionSites.length > 0) {
                    this.creep.setTarget(this.creep.room.getMostBuiltConstructionSite());
                }
            }
        }

        else if(target instanceof StructureTower) {
            this.creep.say('♜');
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
            //Note: in room mode, we do not have bootstrappers fill factories because we want them to build
        //If there are any roads below 50%, repair them
        //If the room has any construction sites, build them
        
        this.creep.say('🤔');

        var workArea = this.mode === "room" ? this.targetRoom : this.targetColony;

        if(((this.creep.room.storage != null && this.creep.room.isInComa()) || this.creep.room.storage == null)
           && workArea.energyAvailable < workArea.energyCapacityAvailable && this.creep.hasEnergy) {
            var closestNonFullFactory = this.creep.pos.findClosestByPath(workArea.nonFullFactories);

            if(closestNonFullFactory != null) {
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

        else if(workArea.halfFullTowers != null && workArea.halfFullTowers.length > 0) {
            var closestTower = this.creep.pos.findClosestByPath(workArea.halfFullTowers);

            if(closestTower != null) {
                this.creep.setTarget(closestTower)
            }
            else {
                var firstHalfFullTower = workArea.halfFullTowers[0];
                if(this.creep.room.name !== firstHalfFullTower.room.name) {
                    this.creep.moveToRoom(firstHalfFullTower.room.name)
                }
                else {
                    console.log("Error finding half full tower for " + this.creep.name);
                }
            }
        }

        else if(this.creep.room.isInComa() && this.creep.room.storage != null) {
            this.creep.setTarget(this.creep.room.storage);
        }

        else if(workArea.constructionSites != null && workArea.constructionSites.length > 0) {
            if(this.mode === 'room') {
                this.creep.say('a');
                this.creep.setTarget(workArea.getMostBuiltConstructionSite());
            }
            else if(this.creep.room.constructionSites != null && this.creep.room.constructionSites.length > 0) {
                this.creep.setTarget(this.creep.room.getMostBuiltConstructionSite());
            }
            else if(this.mode === 'colony') {
                this.creep.setTarget(workArea.roomMostNeedingBuilder.getMostBuiltConstructionSite());
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