RoomPosition.prototype.multiRoomFindClosestByPath = function(objects) {
	var closest = null;
	var closestDistance = 10000000;

	for(var i = 0; i < objects.length; i++) {
		var testing = objects[i];
		var testingPos = (testing.pos == null) ? testing : testing.pos;

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
	if(Game.rooms[this.roomName] == null) return null;

	var structureArray = this.lookFor(LOOK_STRUCTURES);

	if(structureType == null)
	{
		return structureArray[0];
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

	if(structureType == null)
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

RoomPosition.prototype.getConstructionSite = function(structureType)
{
	var constructionSite = this.lookFor(LOOK_CONSTRUCTION_SITES)[0];

	if(constructionSite == null || constructionSite.structureType !== structureType) {
		return null;
	}

	else {
		return constructionSite;
	}
}

RoomPosition.prototype.constructionSiteExists = function(structureType)
{
	var constructionSiteArray = this.lookFor(LOOK_CONSTRUCTION_SITES);

	if(structureType == null)
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

RoomPosition.prototype.getAdjacentWalkablePositions = function()
{
	var walkablePositions = [];

	for(var x_mod = -1; x_mod <= 1; x_mod++)
	{
		var x_to_look_at = Math.max(Math.min(this.x + x_mod, 49), 0);

		for(var y_mod = -1; y_mod <= 1; y_mod++)
		{
			var y_to_look_at = Math.max(Math.min(this.y + y_mod, 49), 0);

			var posBeingLookedAt = new RoomPosition(x_to_look_at, y_to_look_at, this.roomName);
			var IS_WALKABLE = posBeingLookedAt.isWalkableTerrain();

			if(IS_WALKABLE)
			{
				walkablePositions.push(posBeingLookedAt);
			}
		}
	}

	return walkablePositions;
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

	return null;
}

RoomPosition.prototype.hasAdjacentWall = function() {
	return this.lookForAdjacent(LOOK_TERRAIN).includes('wall');
}

RoomPosition.prototype.findMyAdjacentCreeps = function() {
	var adjacentCreeps = this.lookForAdjacent(LOOK_CREEPS);
	var myCreeps = [];

	for(var i = 0; i < adjacentCreeps.length; i++) {
		var creep = adjacentCreeps[i];
		if(creep == null) continue;
		if(creep.my) myCreeps.push(creep);
	}

	return myCreeps;
}

RoomPosition.prototype.getEnemyClosestToDeath = function() {
	var enemies = this.findAdjacentDestroyableStructures().concat(this.findAdjacentEnemyCreeps());
	console.log(enemies);
	if(enemies.length === 0) return null;

	var lowestHealthEnemy = enemies[0];
	for(var i = 1; i < enemies.length; i++) {
		var enemy = enemies[i];
		if(enemy.hits < lowestHealthEnemy.hits) {
			lowestHealthEnemy = enemy;
		}
	}

	return lowestHealthEnemy;
}

RoomPosition.prototype.findAdjacentEnemyCreeps = function() {
	var adjacentCreeps = this.lookForAdjacent(LOOK_CREEPS);
	var enemyCreeps = [];

	for(var i = 0; i < adjacentCreeps.length; i++) {
		var creep = adjacentCreeps[i];
		if(creep == null) continue;
		if(!creep.my) enemyCreeps.push(creep);
	}

	return enemyCreeps;
}

RoomPosition.prototype.findAdjacentDestroyableStructures = function() {
	var adjacentStructures = this.lookForAdjacent(LOOK_STRUCTURES);
	var structuresToReturn = [];

	for(var i = 0; i < adjacentStructures.length; i++) {
		var struct = adjacentStructures[i];
		if(struct == null) continue;
		if(!struct.my && struct.hits != null && struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_ROAD) structuresToReturn.push(struct);
	}

	return structuresToReturn;
}

RoomPosition.prototype.randomMoveAdjacentCreeps = function() {
	var myCreeps = this.findMyAdjacentCreeps();

	for(var i = 0; i < myCreeps.length; i++) {
		var creep = myCreeps[i];
		creep.moveRandom();
	}
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

RoomPosition.prototype.getAdjacentStructures = function(structureType) {
	var adjacentStructures = this.lookForAdjacent(LOOK_STRUCTURES);
	var structuresToReturn = [];

	for(var i = 0; i < adjacentStructures.length; i++) {
		if(adjacentStructures[i] == null) continue;
		if(adjacentStructures[i].structureType === structureType) structuresToReturn.push(adjacentStructures[i]);
	}

	return structuresToReturn;
}

RoomPosition.prototype.getAdjacentConstructionSites = function(structureType) {
	var adjacentSites = this.lookForAdjacent(LOOK_CONSTRUCTION_SITES);
	var sitesToReturn = [];

	for(var i = 0; i < adjacentSites.length; i++) {
		if(adjacentSites[i] == null) continue;
		if(adjacentSites[i].structureType === structureType) sitesToReturn.push(adjacentSites[i]);
	}

	return sitesToReturn;
}

RoomPosition.prototype.isEdge = function() {
	return this.x === 49 || this.x === 0 || this.y === 49 || this.y === 0;
}

RoomPosition.prototype.readableString = function() {
	return this.roomName + this.x + 'x' + this.y + 'y';
}

RoomPosition.prototype.unwalkableStructureExists = function() {
	var structures = this.lookFor(LOOK_STRUCTURES);

	for(var i = 0; i < structures.length; i++) {
		var structure = structures[i];

		if( structure.structureType !== STRUCTURE_RAMPART && 
			structure.structureType !== STRUCTURE_ROAD) {
			return true;
		}
	}

	return false;
}

RoomPosition.prototype.getDestroyableStructures = function(){
	return this.lookFor(LOOK_STRUCTURES, {filter: function(c) { return c.hits != null && !c.my; }});
}

RoomPosition.prototype.getClosestDestroyableStructure = function(){
	return this.findClosestByPath(FIND_HOSTILE_STRUCTURES, {filter: function(c) { return c.hits != null; }});
}