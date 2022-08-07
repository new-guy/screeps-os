const Process = require('Process');

class RoomConstructionSiteManager extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        var structurePlanMap = this.getStructurePlanMap();
        this.drawStructurePlanMap(structurePlanMap);

        if(this.room.constructionSites.length === 0) {
            this.createFirstMissingSite(structurePlanMap);
        }
    }

    getStructurePlanMap() {
        var buildingPlan = this.room.memory.buildingPlan;
        var roadBuildPlan = this.room.memory.roadBuildPlan;
        var structurePlanMap = {};

        //We want to build able to build roads in mining rooms, which don't always have buildingPlans.
        var basePlanToUse = buildingPlan === undefined ? roadBuildPlan : buildingPlan;

        for(var x = 0; x < basePlanToUse.length; x++) {
            var column = basePlanToUse[x];

            for(var y = 0; y < column.length; y++) {
                var structureType = column[y];

                if(structureType === 'none') {
                    if(roadBuildPlan !== undefined && roadBuildPlan[x][y] === 'road') {
                        structureType = STRUCTURE_ROAD;
                    }
                    else {
                        continue;
                    }
                }

                var structPos = {'x': x, 'y': y};

                if(structurePlanMap[structureType] === undefined) {
                    structurePlanMap[structureType] = [structPos];
                }
                else {
                    structurePlanMap[structureType].push(structPos);
                }
            }
        }

        return structurePlanMap;
    }

    drawStructurePlanMap(structurePlanMap) {    
        for(const structureType in structurePlanMap) {
            var structurePosArray = structurePlanMap[structureType];
            for(const posXY of structurePosArray) {
                var x = posXY.x;
                var y = posXY.y;
                var roomPos = new RoomPosition(x, y, this.room.name);
                if(roomPos.structureExists(structureType)) continue;
    
                new RoomVisual(this.room.name).text(structureType.substring(0, 2), x, y+0.1, {font: 0.5});
    
                if(structureType == 'road')
                    new RoomVisual(this.room.name).circle(x, y, {opacity: 0.3, radius: 0.4, fill: '#cccccc'});
    
                if(structureType == 'extension')
                    new RoomVisual(this.room.name).circle(x, y, {opacity: 0.3, radius: 0.4, fill: '#cccc00'});
    
                if(structureType == 'spawn')
                    new RoomVisual(this.room.name).circle(x, y, {opacity: 0.3, radius: 0.4, fill: '#cc00cc'});
    
                if(structureType == 'terminal')
                    new RoomVisual(this.room.name).circle(x, y, {opacity: 0.3, radius: 0.4, fill: '#333333'});
    
                if(structureType == 'link')
                    new RoomVisual(this.room.name).circle(x, y, {opacity: 0.3, radius: 0.4, fill: '#3333ff'});
            }
        }
    }

    createFirstMissingSite(structurePlanMap) {
        for(const structureType of STRUCTURE_BUILD_PRIORITY) {
            var structurePosArray = structurePlanMap[structureType];

            if(structurePosArray === undefined) continue;

            var allSitesExist = this.ensureAllSitesExist(structureType, structurePosArray);
            if(allSitesExist) {
                continue;
            }
            else {
                console.log('Created ' + structureType + ' site in ' + this.room.name);
                break;
            }
        }

        for(const structureType in structurePlanMap) {
            if(STRUCTURE_BUILD_PRIORITY.includes(structureType)) continue;
            var structurePosArray = structurePlanMap[structureType];

            if(structurePosArray === undefined) continue;

            var allSitesExist = this.ensureAllSitesExist(structureType, structurePosArray);
            if(allSitesExist) {
                continue;
            }
            else {
                break;
            }
        }
    }

    ensureAllSitesExist(structureType, structurePosArray) {
        for(const posXY of structurePosArray) {
            if(posXY.x === 0 || posXY.y === 0 || posXY.x === 49 || posXY.y === 49) continue;

            var structPos = new RoomPosition(posXY.x, posXY.y, this.room.name);

            if(!structPos.structureExists(structureType) && !structPos.constructionSiteExists(structureType)) {
                if(structPos.structureExists()) {
                    var struct = structPos.getStructure();
                    struct.destroy();
                    console.log('Destroyed ' + structureType + ' in ' + this.room.name + ' at ' + posXY.x + ', ' + posXY.y);
                }
                else if(structPos.constructionSiteExists()) {
                    var site = structPos.getConstructionSite();
                    site.destroy();
                    console.log('Destroyed ' + structureType + ' site in ' + this.room.name + ' at ' + posXY.x + ', ' + posXY.y);
                }
                else {
                    structPos.createConstructionSite(structureType);
                    console.log('Created ' + structureType + ' site in ' + this.room.name + ' at ' + posXY.x + ', ' + posXY.y);
                }
                return false;
            }
        }

        return true;
    }

    processShouldDie() {
        return false;
    }
}

module.exports = RoomConstructionSiteManager;