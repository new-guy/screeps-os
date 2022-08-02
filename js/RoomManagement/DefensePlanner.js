const Process = require('Process');

var SLEEP_TIMING = 500;

class DefensePlanner extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        console.log('Defense planner disabled')

        // this.placeDefenses();
        // this.sleep(SLEEP_TIMING)
    }

    processShouldDie() {
        return false;
    }

    placeDefenses()
    {
        for(var x = 0; x < 50; x++)
        {
            for(var y = 0; y < 50; y++)
            {
                var isNearEdge = ((x === 2 || x === 1 || x === 47 || x === 48) || (y === 2 || y === 1 || y === 47 || y === 48));

                if(!isNearEdge) continue;

                var workingPosition = this.room.getPositionAt(x, y);

                //No Construction sites, plains
                var noConstructionSite = (workingPosition.lookFor(LOOK_CONSTRUCTION_SITES).length === 0);
                var hasPlains = (_.includes(workingPosition.lookFor(LOOK_TERRAIN), "plain"));
                var hasSwamp = (_.includes(workingPosition.lookFor(LOOK_TERRAIN), "swamp"));

                var isValidPosition = (noConstructionSite && (hasPlains || hasSwamp));

                if(!isValidPosition) continue;

                var rangeToClosestExit = this.getRangeToClosest(workingPosition, FIND_EXIT);

                var wallNotRampart = this.wallOrRampart(workingPosition);

                if(rangeToClosestExit === 2)
                {
                    var structureType = wallNotRampart ? STRUCTURE_WALL : STRUCTURE_RAMPART;
                    var color = wallNotRampart ? COLOR_BROWN : COLOR_RED;

                    var constructionFlagName = "!CONSTRUCT" + structureType + "|" + workingPosition.roomName + "|x" + workingPosition.x + "y" + workingPosition.y;
                    var constructionFlagExists = Game.flags[constructionFlagName] !== undefined;
                    if(constructionFlagExists) continue;

                    this.placeNewPlanningFlag(workingPosition, structureType, COLOR_GREY, color);
                }
            }
        }
    }

    wallOrRampart(position)
    {
        if(position.x <= 2 || position.x >= 47)
        {
            return (position.y % 2 === 1);
        }

        else if(position.y <= 2 || position.y >= 47)
        {
            return (position.x % 2 === 1);
        }

        else return false;
    }

    getRangeToClosest(position, type)
    {
        var closest = position.findClosestByRange(type);

        return position.getRangeTo(closest);
    }

    placeNewPlanningFlag(pos, type, color = COLOR_WHITE, secondaryColor = COLOR_WHITE)
    {
        var flagName = "!PLAN|" + type + "|" + pos.roomName + "|x" + pos.x + "y" + pos.y;

        pos.createFlag(flagName, color, secondaryColor);
    }
}

module.exports = DefensePlanner;

