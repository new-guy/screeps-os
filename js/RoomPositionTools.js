RoomPosition.prototype.findFurthestByRange = function(type, opts = {})
{
	var room = Game.rooms[this.roomName];

	if(room === undefined) return null;

	var foundArray = room.find(type, opts);

	var ret = null;
	var rangeToRet = 0;

	for(var i = 0; i < foundArray.length; i++)
	{
		var foundItem = foundArray[i];
		var rangeToFoundItem = this.getRangeTo(foundItem);

		if(ret === null)
		{
			ret = foundItem;
			rangeToRet = rangeToFoundItem;
			continue;
		}

		else if(rangeToFoundItem > rangeToRet)
		{
			ret = foundItem;
			rangeToRet = rangeToFoundItem;
		}
	}

	return ret;
}

RoomPosition.prototype.multiRoomFindClosestByPath = function(objects) {
	var closest = null;
	var closestDistance = 10000000;

	for(var i = 0; i < objects.length; i++) {
		var testing = objects[i];
		var testingPos = (testing.pos === undefined) ? testing : testing.pos;

		try {
			var pathToTesting = PathFinder.search(this, testingPos).path;
			var testingDistance = pathToTesting.length;

			if(testingDistance < closestDistance) {
				closestDistance = testingDistance;
				closest = testing;
			}

		} catch (error) {
			console.log('Cannot find path to ' + testingPos.toString());
			console.log(error);
		}
	}

	return closest;
}

RoomPosition.prototype.creepExists = function()
{
	return this.lookFor(LOOK_CREEPS).length > 0;
}

RoomPosition.prototype.getStructure = function(structureType)
{
	var structureArray = this.lookFor(LOOK_STRUCTURES);

	if(structureType === undefined)
	{
		return structureArray.length > 0;
	}

	for(var i = 0; i < structureArray.length; i++)
	{
		if(structureArray[i].structureType === structureType)
		{
			return structureArray[i];
		}
	}

	return null;
}

RoomPosition.prototype.structureExists = function(structureType)
{
	var structureArray = this.lookFor(LOOK_STRUCTURES);

	if(structureType === undefined)
	{
		return structureArray.length > 0;
	}

	var ret = false;
	for(var i = 0; i < structureArray.length; i++)
	{
		if(structureArray[i].structureType === structureType)
		{
			ret = true;
			break;
		}
	}

	return ret;
}

RoomPosition.prototype.constructionSiteExists = function(structureType)
{
	var constructionSiteArray = this.lookFor(LOOK_CONSTRUCTION_SITES);

	if(structureType === undefined)
	{
		return constructionSiteArray.length > 0;
	}

	var ret = false;
	for(var i = 0; i < constructionSiteArray.length; i++)
	{
		if(constructionSiteArray[i].structureType === structureType)
		{
			ret = true;
			break;
		}
	}

	return ret;
}

RoomPosition.prototype.isWalkableTerrain = function()
{
	var hasPlains = (_.includes(this.lookFor(LOOK_TERRAIN), "plain"));
	var hasSwamp = (_.includes(this.lookFor(LOOK_TERRAIN), "swamp"));

	return (hasPlains || hasSwamp);
}

RoomPosition.prototype.simpleCanBuildStructure = function(structureType)
{
	var correctTerrain = this.isWalkableTerrain();
	var noConstructionSite = !this.constructionSiteExists(structureType);
	var noStructure = !this.structureExists(structureType);

	return (correctTerrain && noConstructionSite && noStructure);
}

RoomPosition.prototype.hasOpenAdjacentTile = function()
{
	for(var x_mod = -1; x_mod <= 1; x_mod++)
	{
		var x_to_look_at = Math.max(Math.min(this.x + x_mod, 49), 0);

		for(var y_mod = -1; y_mod <= 1; y_mod++)
		{
			var y_to_look_at = Math.max(Math.min(this.y + y_mod, 49), 0);

			var posBeingLookedAt = new RoomPosition(x_to_look_at, y_to_look_at, this.roomName);

			var CREEP_AT_SPOT = posBeingLookedAt.creepExists();
			var CONSTRUCTION_AT_SPOT = posBeingLookedAt.constructionSiteExists(STRUCTURE_CONTAINER);
			var STRUCTURE_AT_SPOT = posBeingLookedAt.structureExists(STRUCTURE_CONTAINER);
			var IS_WALKABLE = posBeingLookedAt.isWalkableTerrain();

			if(!CREEP_AT_SPOT && !CONSTRUCTION_AT_SPOT && !STRUCTURE_AT_SPOT && IS_WALKABLE)
			{
				return true;
			}
		}
	}

	return false;
		//between 0 & 49

	//No construction spot, terrain is walkable, no buildings
	//Get adjacent squares, check if construction site or structure exists
}

RoomPosition.prototype.getOpenAdjacentPos = function()
{
	for(var x_mod = -1; x_mod <= 1; x_mod++)
	{
		var x_to_look_at = Math.max(Math.min(this.x + x_mod, 49), 0);

		for(var y_mod = -1; y_mod <= 1; y_mod++)
		{
			var y_to_look_at = Math.max(Math.min(this.y + y_mod, 49), 0);

			var posBeingLookedAt = new RoomPosition(x_to_look_at, y_to_look_at, this.roomName);

			var CONSTRUCTION_AT_SPOT = posBeingLookedAt.constructionSiteExists(STRUCTURE_CONTAINER);
			var STRUCTURE_AT_SPOT = posBeingLookedAt.structureExists(STRUCTURE_CONTAINER);
			var IS_WALKABLE = posBeingLookedAt.isWalkableTerrain();

			if(!CONSTRUCTION_AT_SPOT && !STRUCTURE_AT_SPOT && IS_WALKABLE)
			{
				return posBeingLookedAt;
			}
		}
	}

	return undefined;
}

RoomPosition.prototype.hasAdjacentWall = function() {
	return this.lookForAdjacent(LOOK_TERRAIN).includes('wall');
}

RoomPosition.prototype.lookForAdjacent = function(lookType) {
	var results = [];

	for(var x_mod = -1; x_mod <= 1; x_mod++)
	{
		var x_to_look_at = Math.max(Math.min(this.x + x_mod, 49), 0);

		for(var y_mod = -1; y_mod <= 1; y_mod++)
		{
			var y_to_look_at = Math.max(Math.min(this.y + y_mod, 49), 0);

			var posBeingLookedAt = new RoomPosition(x_to_look_at, y_to_look_at, this.roomName);

			results.push(posBeingLookedAt.lookFor(lookType)[0]);
		}
	}

	return results;
}

RoomPosition.prototype.isEdge = function() {
	return this.x === 49 || this.x === 0 || this.y === 49 || this.y === 0;
}

RoomPosition.prototype.readableString = function() {
	return this.roomName + this.x + 'x' + this.y + 'y';
}