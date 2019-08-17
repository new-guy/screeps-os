var MIN_DIST_FROM_SK = 5;

Creep.prototype.getSafePath = function(targetPosition, range=0) {
    let goals = {pos: targetPosition, range: range};

    let ret = PathFinder.search(this.pos, goals,
        {
          // We need to set the defaults costs higher so that we
          // can set the road cost lower in `roomCallback`
          plainCost: 2,
          swampCost: 5,
    
          roomCallback: function(roomName) {
            let room = Game.rooms[roomName];
            if (!room) return;
            let costs = new PathFinder.CostMatrix;
    
            // Avoid creeps in the room
            var enemyCreeps = room.find(FIND_CREEPS, {filter: function(creep){
                return creep.isHostile();
            }});

            if(enemyCreeps.length > 0) {
                for(var x = 0; x < 49; x++) {
                    for(var y = 0; y < 49; y++) {
                        var position = new RoomPosition(x, y, roomName);
                        
                        var nearestEnemy = position.findClosestByRange(enemyCreeps);

                        if(position.getRangeTo(nearestEnemy) <= MIN_DIST_FROM_SK) {
                            costs.set(x, y, 0xff);
                        }
                    }
                }
            }
    
            return costs;
          },
        }
    );

    return ret.path;
}

Creep.prototype.curse = function() {
    this.sayInOrder(['Fuck', 'Shit!', 'Dang', 'Dag', 'Wtf?', 'Wut']);
}

Creep.prototype.sayInOrder = function(words) {
    if(this.memory.talkStart === undefined) {
        this.memory.talkStart = Game.time;
    }

    var index = (Game.time + this.memory.talkStart) % words.length;

    this.say(words[index]);
}

Creep.prototype.isFull = function()
{
	return (_.sum(this.carry) === this.carryCapacity);
}

Creep.prototype.isEmpty = function()
{
	return(_.sum(this.carry) === 0);
}

Creep.prototype.fillAdjacentFactories = function()
{
	var adjacentStructureArray = this.getAdjacentStructureArray();

	for(var i = 0; i < adjacentStructureArray.length; i++)
	{
		var workingStructure = adjacentStructureArray[i];

		if ((workingStructure.structureType === STRUCTURE_EXTENSION || 
			(this.room.storage !== undefined && workingStructure.structureType === STRUCTURE_SPAWN)) && 
			workingStructure.energy < workingStructure.energyCapacity)
		{
			this.cancelOrder('move');
			return (this.transfer(workingStructure, RESOURCE_ENERGY) == 0);
		}
	}
}

Creep.prototype.getAdjacentStructureArray = function()
{
	var top = Math.max(0, this.pos.y-1);
	var left = Math.max(0, this.pos.x-1);
	var bottom = Math.min(49, this.pos.y+1);
	var right = Math.min(49, this.pos.x+1);

	var adjacentStructureObject = this.room.lookForAtArea('structure', top, left, bottom, right);

	var adjacentStructureArray = [];

	for(var row_coord in adjacentStructureObject)
	{
		var row = adjacentStructureObject[row_coord];

		for(var column in row)
		{
			var cell = row[column];

			if(cell === undefined) continue;

			for(var i = 0; i < cell.length; i++)
			{
				adjacentStructureArray.push(cell[i]);
			}
		}
	}

	return adjacentStructureArray;
}