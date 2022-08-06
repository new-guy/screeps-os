const Process = require('Process');

class PlanningConstructionFlagMonitor extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        var constructionFlags = this.room.find(FIND_FLAGS, {filter: function(flag) { return flag.name.startsWith('!CONSTRUCT') }});
        if(this.room.constructionSites == undefined) return;
        if((this.room.constructionSites == undefined || this.room.constructionSites.length == 0) && constructionFlags.length == 0) //Every other tick so we avoid double building
        {
            console.log('Trying to convert plan flag');
            this.convertPlanFlagToConstruction();
        }
    
        else {
            this.convertConstructionFlags(constructionFlags);
        }
    }

    processShouldDie() {
        return false;
    }

    convertConstructionFlags(constructionFlagArray)
    {
        for(var i = 0; i < constructionFlagArray.length; i++)
        {
            var flag = constructionFlagArray[i];
            var structType = flag.name.split("|")[1];
            
            if(Game.rooms[flag.pos.roomName] === undefined) continue;
            var constructionSitesAtPos = flag.pos.lookFor(LOOK_CONSTRUCTION_SITES);
    
            if(flag.pos.structureExists(structType))
            {
                flag.remove();
            }
    
            else if(constructionSitesAtPos.length === 0)
            {
                flag.pos.createConstructionSite(structType);
            }
        }
    }

    convertPlanFlagToConstruction() {
        if(this.room.memory.buildingPlan === undefined) {
            console.log('No build plan for ' + this.room.name);
            return;
        }

        var planFlags = this.room.find(FIND_FLAGS, {filter: function(flag) { return flag.name.startsWith('!PLAN') }});
    
        var convertedFlag = false;

        //Start by doing priority flag conversion
        for (var i = 0; i < STRUCTURE_BUILD_PRIORITY.length; i++) {
            var structureType = STRUCTURE_BUILD_PRIORITY[i];
            var filteredPlanFlagArray = getPlanFlagArrayByStructureType(planFlags, structureType);
            convertedFlag = attemptToConvertPlanFlagArray(filteredPlanFlagArray, this.room);

            if(convertedFlag) break;
        }

        //Try to convert everything
        if(!convertedFlag) {
            convertedFlag = attemptToConvertPlanFlagArray(planFlags, this.room)
        }
    
        if(!convertedFlag) {
            attemptToRemoveInvalidStructure(this.room)
        }

        function getPlanFlagArrayByStructureType(planFlagArray, structureType) {
            var filteredArray = [];
            for(var i = 0; i < planFlagArray.length; i++) {
                var planFlag = planFlagArray[i];
                var planStructureType = planFlag.name.split("|")[1];

                if(planStructureType === structureType) {
                    filteredArray.push(planFlag);
                }
            }
            return filteredArray;
        }

        function attemptToConvertPlanFlagArray(planFlagArray, room) {
            var flagPlaced = false;
            for(var i = 0; i < planFlagArray.length; i++)
            {
                var planFlag = planFlagArray[i];
                var structureType = planFlag.name.split("|")[1];
        
                if(room.hasNoBuildingSlots(structureType)) {
                    console.log('WARNING: Room ' + room.name + ' cannot build ' + structureType + ' - has no building slots');
                    continue;
                }
    
                var placingObstacleStructure = OBSTACLE_OBJECT_TYPES.includes(structureType);
                if(placingObstacleStructure) {
                    var obstacleStructureUnderneath = _.find(planFlag.pos.lookFor(LOOK_STRUCTURES), 
                    function(struct) { 
                        return OBSTACLE_OBJECT_TYPES.includes(struct.structureType)
                    });
    
                    if(obstacleStructureUnderneath !== undefined) {
                        if(obstacleStructureUnderneath.my) {
                            console.log('DESTROYING INVALID ' + obstacleStructureUnderneath.structureType + ' at ' + obstacleStructureUnderneath.pos.x + 'x ' + obstacleStructureUnderneath.pos.y + 'y ' + room.name);
                            obstacleStructureUnderneath.destroy();
                        }
        
                        else {
                            console.log('WARNING: Room ' + room.name + ' cannot build ' + planFlag.name + ' because something is in the way');
                            continue;
                        }
                    }
                }
    
                placeNewConstructionFlag(planFlag.pos, structureType);
                flagPlaced = true;
                break;
            }

            return flagPlaced;
        }

        function attemptToRemoveInvalidStructure(room) {
            for(var i = 0; i < STRUCTURE_REMOVE_PRIORITY.length; i++) {
                var typeOfStructureToRemove = STRUCTURE_REMOVE_PRIORITY[i];
                if(room.hasNoBuildingSlots(typeOfStructureToRemove) && !room.hasZeroBuildingSlots(typeOfStructureToRemove)) {
                    var myStructures = room.find(FIND_MY_STRUCTURES);
    
                    console.log('trying to remove ' + typeOfStructureToRemove);
                    var structureToRemove = _.find(myStructures, function(struct) {
                        var buildingPlan = Game.rooms[struct.pos.roomName].memory.buildingPlan;
    
                        var structureTypeAtPlanPos = buildingPlan[struct.pos.x][struct.pos.y];
                        var isInBuildingPlan = (structureTypeAtPlanPos == struct.structureType);
    
                        console.log('Structure ' + struct.structureType + ' at ' + struct.pos.x + 'x ' + struct.pos.y + 'y ' + ' vs plan ' + structureTypeAtPlanPos + ' | ' + isInBuildingPlan);
    
                        var isCorrectStructureType = (struct.structureType == typeOfStructureToRemove);
                        return !isInBuildingPlan && isCorrectStructureType; 
                    });

                    if(structureToRemove === undefined) break;
    
                    console.log('DESTROYING ' + structureToRemove.structureType + ' at ' + structureToRemove.pos.x + 'x ' + structureToRemove.pos.y + 'y ' + this.name);
                    structureToRemove.destroy();
                    break;
                }
            }
        }
    
        function placeNewConstructionFlag(pos, structureType, color = COLOR_WHITE, secondaryColor = COLOR_WHITE)
        {
            var flagName = "!CONSTRUCT|" + structureType + "|" + pos.roomName + "|x" + pos.x + "y" + pos.y;
        
            console.log('Placing flag ' + flagName);
            pos.createFlag(flagName, color, secondaryColor);
            planFlag.remove();
        }
    }
}

module.exports = PlanningConstructionFlagMonitor;