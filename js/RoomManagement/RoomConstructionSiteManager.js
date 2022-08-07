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
        console.log('printing stuff about this process');

        if(this.room.constructionSites.length > 0) {
            console.log(this.room.name + ' has site(s)')
        }
        else {
            console.log('no sites for room')

            var structurePlanMap = this.getStructurePlanMap();
            this.createFirstMissingSite(structurePlanMap);
        }
    }

    getStructurePlanMap() {
        var buildingPlan = this.room.memory.buildingPlan;
        var roadBuildPlan = this.room.memory.roadBuildPlan;
        var structurePlanMap = {};

        for(var x = 0; x < buildingPlan.length; x++) {
            var column = buildingPlan[x];

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
                console.log('Created ' + structureType + ' site in ' + this.room.name);
                break;
            }
        }
    }

    ensureAllSitesExist(structureType, structurePosArray) {
        for(const posXY of structurePosArray) {
            var structPos = new RoomPosition(posXY.x, posXY.y, this.room.name);
            if(!structPos.structureExists(structureType) && !structPos.constructionSiteExists(structureType)) {
                structPos.createConstructionSite(structureType);
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