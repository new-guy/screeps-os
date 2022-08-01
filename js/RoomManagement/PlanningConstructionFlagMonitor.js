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
        var planFlags = this.room.find(FIND_FLAGS, {filter: function(flag) { return flag.name.startsWith('!PLAN') }});
    
        var fullStructTypes = [];
    
        var convertedFlag = false;
    
        for(i = 0; i < planFlags.length; i++)
        {
            var planFlag = planFlags[i];
            var structureType = planFlag.name.split("|")[1];
    
            if(fullStructTypes.includes(structureType)) continue;
    
            if(this.room.hasNoBuildingSlots(structureType) && !fullStructTypes.includes(structureType)) {
                console.log('WARNING: Room ' + this.room.name + ' cannot build ' + structureType);
                fullStructTypes.push(structureType);
            }
            
            else {
                console.log('Room ' + this.room.name + ' placing flag to build ' + structureType);
    
                var placingObstacleStructure = OBSTACLE_OBJECT_TYPES.includes(OBSTACLE_OBJECT_TYPES);
    
                if(placingObstacleStructure) {
                    var invalidStructureUnderneath = _.find(planFlag.pos.lookFor(LOOK_STRUCTURES), 
                    function(struct) { 
                        return struct.structureType != STRUCTURE_ROAD && struct.structureType != STRUCTURE_RAMPART 
                    });
    
                    if(invalidStructureUnderneath !== undefined) {
                        if(invalidStructureUnderneath.my) {
                            console.log('DESTROYING INVALID ' + invalidStructureUnderneath.structureType + ' at ' + invalidStructureUnderneath.pos.x + 'x ' + invalidStructureUnderneath.pos.y + 'y ' + this.room.name);
                            invalidStructureUnderneath.destroy();
        
                            placeNewConstructionFlag(planFlag.pos, structureType);
        
                            planFlag.remove();
                            convertedFlag = true;
                            break;
                        }
        
                        else {
                            console.log('WARNING: Room ' + this.room.name + ' cannot build ' + planFlag.name + ' because something is in the way');
                            continue;
                        }
                    }
                }
    
                else {
                    placeNewConstructionFlag(planFlag.pos, structureType);
                    planFlag.remove();
                    convertedFlag = true;
                    break;
                }
            }
        }
    
        if(!convertedFlag) {
            var removePriority = [STRUCTURE_EXTENSION,
                                  STRUCTURE_LINK,
                                  STRUCTURE_TOWER,
                                  STRUCTURE_LAB,
                                  STRUCTURE_OBSERVER,
                                  STRUCTURE_NUKER,
                                  STRUCTURE_TERMINAL,
                                  STRUCTURE_STORAGE,
                                  STRUCTURE_SPAWN];
    
            for(var i = 0; i < removePriority.length; i++) {
                var typeOfStructureToRemove = removePriority[i];
                if(fullStructTypes.includes(typeOfStructureToRemove)) {
                    var myStructures = this.room.find(FIND_MY_STRUCTURES);
    
                    console.log('trying to remove ' + typeOfStructureToRemove);
                    var structureToRemove = _.find(myStructures, function(struct) {
                        //correct structureType
                        //also not part of room plan
                        var buildingPlan = Game.rooms[struct.pos.roomName].memory.buildingPlan;
    
                        var structureTypeAtPlanPos = buildingPlan[struct.pos.x][struct.pos.y];
                        var isInBuildingPlan = (structureTypeAtPlanPos == struct.structureType);
    
                        console.log('Structure ' + struct.structureType + ' at ' + struct.pos.x + 'x ' + struct.pos.y + 'y ' + ' vs plan ' + structureTypeAtPlanPos + ' | ' + isInBuildingPlan);
    
                        var isCorrectStructureType = (struct.structureType == typeOfStructureToRemove);
                        return !isInBuildingPlan && isCorrectStructureType; 
                    });
    
                    console.log('DESTROYING ' + structureToRemove.structureType + ' at ' + structureToRemove.pos.x + 'x ' + structureToRemove.pos.y + 'y ' + this.name);
                    structureToRemove.destroy();
                    break;
                }
            }
        }
    
        function placeNewConstructionFlag(pos, structureType, color = COLOR_WHITE, secondaryColor = COLOR_WHITE)
        {
            var flagName = "!CONSTRUCT|" + structureType + "|" + pos.roomName + "|x" + pos.x + "y" + pos.y;
        
            pos.createFlag(flagName, color, secondaryColor);
        }
    }
}

module.exports = PlanningConstructionFlagMonitor;