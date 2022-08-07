var VALID_STRUCTURES_TO_RAMPART = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_LINK, STRUCTURE_TERMINAL, STRUCTURE_TOWER, STRUCTURE_STORAGE];

Room.prototype.updateBuildingPlans = function() {
	var latestRCLGenerated = this.memory.latestRCLGenerated;

	if(latestRCLGenerated === undefined) latestRCLGenerated = 0;

	var roomIsMine = (this.controller !== undefined && this.controller.my);
	if(!roomIsMine) return;

	if(this.memory.planGenerationState === undefined) {
		this.memory.planGenerationState = 'waiting';
	}

	if(parseInt(latestRCLGenerated) != this.controller.level && this.memory.planGenerationState == 'waiting')
	{
		console.log('CLEARING FUNCTIONAL FLAGS FOR ' + this.name);
		this.killGeneratedPlan();
		this.memory.planGenerationState = 'chunks';
	}

	else if(this.memory.planGenerationState ===  'chunks') {
		console.log('GENERATING CHUNK FLAGS FOR ' + this.name);
		var chunkFlagsToPlace = this.calculateChunkPositions(this.controller.level.toString());
		this.placeChunkFlags(chunkFlagsToPlace);

		this.memory.planGenerationState = 'implement';
	}

	else if(this.memory.planGenerationState ===  'implement') {
		console.log('GENERATING LAYOUT FOR ' + this.name);

		this.recalculateBuildingPlan();
		this.createFunctionalFlags();
		this.generateControllerSinkLinkPlan();
		this.generateMineralMiningPlan();
		this.memory.latestRCLGenerated = this.controller.level;
		
		this.memory.planGenerationState = 'waiting';
	}

	//NEW ROOM UPDATE FLOW - span multiple ticks by only starting first step on some modulo,
	//but start subsequent steps at any time if that step is set in memory
	/*
	--wait
	1. Clear link, and balancer flags from room.  Keep chunk flags
	--chunks
	2. Find locations for chunks
	3. Place module flags
	--implement
	4. Recalculate the building plan
	5. Create functional flags
	6. Create controller sink link
	7. Create road build flag
	*/
};

//Flags look like this: !CONSTRUCT|BUILDINGTYPE|UNIQUEIFIER

Room.prototype.forceBuildingRegeneration = function() {
	console.log('CLEARING FUNCTIONAL FLAGS FOR ' + this.name);
	this.killGeneratedPlan();
	this.memory.planGenerationState = 'chunks';
}

Room.prototype.placeChunkFlags = function(chunkFlags) {
	for(var i = 0; i < chunkFlags.length; i++) {
		var chunkFlagDefinition = chunkFlags[i];
		var flagName = chunkFlagDefinition['flagName'];

		var color = COLOR_WHITE;

		switch(flagName.split("|")[1]) {
			case "heart": color = COLOR_RED;
			case "basic_labs": color = COLOR_CYAN;
			case "battery": color = COLOR_YELLOW;
			case "bigbattery56": color = COLOR_YELLOW;
			case "bigbattery78": color = COLOR_YELLOW;
		}

		chunkFlagDefinition['pos'].createFlag(flagName, color);
	}
}

Room.prototype.calculateChunkPositions = function(rclString) {
	var chunks = chunkSetsByRCL[rclString];

	var chunkFlagsToPlace = []; //Array of {flagName, roomPosition}
	var heartPosition = undefined;

	var heartChunkFlag = Game.flags['!CHUNK|heart|' + this.name];
	if(heartChunkFlag === undefined) {
		console.log('CANNOT FIND HEART FLAG FOR ' + this.name);
		return false;
	}

	else {
		heartPosition = heartChunkFlag.pos;
	}

	var typeCountDict = {};

	for(var i = 0; i < chunks.length; i++) {
		var chunkType = chunks[i];

		if(chunkType === 'heart') continue;

		var chunkRoot = this.findRootForChunk(chunkType, heartPosition, searchDistance=20);

		if(chunkRoot === null) {
			continue;
		}

		var typeCount = (typeCountDict[chunkType] === undefined ? 0 : typeCountDict[chunkType]);

		var flagName = "!CHUNK|" + chunkType + "|" + this.name + "|" + typeCount;

		if(Game.flags[flagName] === undefined)  {
			chunkFlagsToPlace.push({
				"flagName": "!CHUNK|" + chunkType + "|" + this.name + "|" + typeCount,
				"pos": chunkRoot
			});

			console.log('Would place chunk ' + chunkType + ' at ' + chunkRoot.x + 'x ' + chunkRoot.y + 'y ');
		}

		else {
			console.log('Found chunk ' + flagName);
		}

		typeCountDict[chunkType] = typeCount + 1;
	}

	return chunkFlagsToPlace;
}

Room.prototype.findRootForChunk = function(chunkType, searchStartPos, searchDistance=10) {
	//Check from 1,1 to 48,48
	var highestFitness = 0
	var bestX = -1;
	var bestY = -1;
	
	xloop:
	for(var x_mod = -1 * searchDistance; x_mod <= searchDistance; x_mod++) {
		for(var y_mod = -1 * searchDistance; y_mod <= searchDistance; y_mod++) {
			var x = searchStartPos.x + x_mod;
			var y = searchStartPos.y + y_mod;

			if(x > 47 || x < 2 || y > 47 || y < 2) continue;

			var rootPosition = new RoomPosition(x, y, this.name);

			var fitness = getFitnessForPosition(chunkType, rootPosition, searchStartPos);

			if(fitness > highestFitness) {
				highestFitness = fitness;
				bestX = x;
				bestY = y;
			}

			if(fitness >= 48) break xloop; //Good enough - within 2 squares of the goal position
		}
	}

	if(bestX === -1 || bestY === -1) {
		console.log('ERROR - cannot find room for chunk ' + chunkType + ' in room ' + this.name);
		return null;
	}

	return new RoomPosition(bestX, bestY, this.name);

	function getFitnessForPosition(chunkType, rootPosition, searchStartPos) {
		//Fail if any buildings are too close to the edge
		//Fail if any overlaps unwalkable terrain
		//Fail if any non-road building is within 1 range of any non-road, non-rampart building
		//Fitness = 50 - distance from root to heart
		var absolutePositions = getAbolutePositionsFromPos(chunkType, rootPosition, '8');

		for(var i = 0; i < absolutePositions.length; i++) {
			var x_pos = absolutePositions[i]['x'];
			var y_pos = absolutePositions[i]['y'];

			if(x_pos < 2 || y_pos < 2 || x_pos > 47 || y_pos > 47) return 0;

			var position = new RoomPosition(absolutePositions[i]['x'], absolutePositions[i]['y'], rootPosition.roomName);

			if(position.hasAdjacentWall()) return 0;

			if(absolutePositions[i]['type'] == 'structure' && absolutePositions[i]['structureType'] !== 'road') {
				var adjacentUnwalkableStructures = position.findInRange(FIND_STRUCTURES, 1, {filter: function(struct) { 
					return struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_WALL; }});

				var adjacentUnwalkableConstructionSites = position.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: function(struct) { 
					return struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_WALL; }});

				if( adjacentUnwalkableStructures.length > 0 ||
					adjacentUnwalkableConstructionSites.length > 0) return 0;
			}
		}

		var fitness = 50 - rootPosition.getRangeTo(searchStartPos);

		return fitness;
	}
	//Function to evaluate location fitness
}

Room.prototype.recalculateBuildingPlan = function() {
	var buildingPlan = new Array(50);

	for(var i = 0; i < buildingPlan.length; i++)  {
		buildingPlan[i] = new Array(50).fill('none');
	}

	var flagPlan = new Array(50);

	for(var i = 0; i < flagPlan.length; i++)  {
		flagPlan[i] = new Array(50).fill('none');
	}

	var chunkFlags = _.filter(this.find(FIND_FLAGS), function(flag) { return flag.name.startsWith('!CHUNK|'); });

	for(var i = 0; i < chunkFlags.length; i++) {
		console.log(chunkFlags[i].name);

		var chunkFlag = chunkFlags[i];

		var absolutePositions = getAbsolutePositionsFromChunkFlag(chunkFlag, this.controller.level.toString());
		
		for(var q = 0; q < absolutePositions.length; q++) {
			var absolutePosition = absolutePositions[q]
			var x_pos = absolutePosition['x'];
			var y_pos = absolutePosition['y'];
			
			if(absolutePosition['type'] == 'structure') {
				buildingPlan[x_pos][y_pos] = absolutePosition['structureType'];
			}

			else if(absolutePosition['type'] == 'flag') {

				Memory.temp4 = absolutePosition;
				flagPlan[x_pos][y_pos] = absolutePosition['flagName'];
			}
		}
		//Get the absolute positions of the buildings from the chunk flag
		//Add them to the buildingPlan
	}

	this.memory.buildingPlan = buildingPlan;
	this.memory.flagPlan = flagPlan;
}

function getAbsolutePositionsFromChunkFlag(chunkFlag, rclString) {
	var rootPos = chunkFlag.pos;
	var chunkType = chunkFlag.name.split('|')[1];

	return getAbolutePositionsFromPos(chunkType, rootPos, rclString);
}

function getAbolutePositionsFromPos(chunkType, rootPos, rclString) {
	var buildingsToPlan = [];
	var chunkDefinition = {};
	if(chunkDefinitions[chunkType][rclString] !== undefined) {
		chunkDefinition = chunkDefinitions[chunkType][rclString];
	}
	else if(chunkDefinitions[chunkType]['default'] !== undefined) {
		chunkDefinition = chunkDefinitions[chunkType]['default'];
	}
	else {
		console.log('Cannot find chunk definition for ' + chunkType);
		return;
	}

	var buildingsToPlan = chunkDefinition['buildings'];

	var designRootPos = chunkDefinitions[chunkType]['root'];

	var absolutePositions = [];
	for(var structureType in buildingsToPlan)
	{
		var structurePositions = buildingsToPlan[structureType]['pos'];

		for(var i = 0; i < structurePositions.length; i++) 
		{
			var designPosition = structurePositions[i];
			var absolutePosition = getAbolutePosition(designPosition, designRootPos, rootPos);

			absolutePosition['structureType'] = structureType;
			absolutePosition['type'] = 'structure';
			absolutePositions.push(absolutePosition);
		}
	}

	if(chunkDefinition['balancer_flags'] !== undefined) {
		var balancerFlags = chunkDefinition['balancer_flags'];

		var startFlags = balancerFlags['balancer_start'];
		for(var i = 0; i < startFlags.length; i++) {
			var startFlagPosition = balancerFlags['balancer_start'][i];
			var startFlagAbsolutePosition = getAbolutePosition(startFlagPosition, designRootPos, rootPos);
	
			var balancerTeamUid = rootPos.x + 'x' + rootPos.y + 'y' + rootPos.roomName;
			var endFlagName = '!BALSTART|' + chunkType + '|' + balancerTeamUid + '|' + i;
	
			startFlagAbsolutePosition['type'] = 'flag';
			startFlagAbsolutePosition['flagName'] = endFlagName;
	
			absolutePositions.push(startFlagAbsolutePosition);
		}

		var endFlags = balancerFlags['balancer_end'];
		for(var i = 0; i < endFlags.length; i++) {
			var endFlagPosition = balancerFlags['balancer_end'][i];
			var endFlagAbsolutePosition = getAbolutePosition(endFlagPosition, designRootPos, rootPos);
	
			var balancerTeamUid = rootPos.x + 'x' + rootPos.y + 'y' + rootPos.roomName;
			var endFlagName = '!BALEND|' + chunkType + '|' + balancerTeamUid + '|' + i;
	
			endFlagAbsolutePosition['type'] = 'flag';
			endFlagAbsolutePosition['flagName'] = endFlagName;
	
			absolutePositions.push(endFlagAbsolutePosition);
		}
	}

	if(chunkDefinition['harvest_destination'] !== undefined) {
		var harvestDestPosition = chunkDefinition['harvest_destination'];
		var harvestDestAbsolutePosition = getAbolutePosition(harvestDestPosition, designRootPos, rootPos);

		var destFlagName = '!HARVESTDEST|' + rootPos.roomName;
	
		harvestDestAbsolutePosition['type'] = 'flag';
		harvestDestAbsolutePosition['flagName'] = destFlagName;

		absolutePositions.push(harvestDestAbsolutePosition);
	}

	if(chunkDefinition['link_flags'] !== undefined) {
		var linkFlags = chunkDefinition['link_flags'];

		var sourceFlags = linkFlags['sources'];
		for(var i = 0; i < sourceFlags.length; i++) {
			var sourceFlagPosition = linkFlags['sources'][i];
			var sourceFlagAbsolutePosition = getAbolutePosition(sourceFlagPosition, designRootPos, rootPos);

			var linkUid = rootPos.x + 'x' + rootPos.y + 'y' + rootPos.roomName + i;
			var sourceFlagNamer = '!LINKSOURCE|' + linkUid;
	
			sourceFlagAbsolutePosition['type'] = 'flag';
			sourceFlagAbsolutePosition['flagName'] = sourceFlagNamer;
	
			absolutePositions.push(sourceFlagAbsolutePosition);
		}

		var sinkFlags = linkFlags['sinks'];
		for(var i = 0; i < sinkFlags.length; i++) {
			var sinkFlagPosition = linkFlags['sinks'][i];
			var sinkFlagAbsolutePosition = getAbolutePosition(sinkFlagPosition, designRootPos, rootPos);
	
			var linkUid = rootPos.x + 'x' + rootPos.y + 'y' + rootPos.roomName + i;
			var sinkFlagName = '!LINKSINK|' + linkUid;
	
			sinkFlagAbsolutePosition['type'] = 'flag';
			sinkFlagAbsolutePosition['flagName'] = sinkFlagName;
	
			absolutePositions.push(sinkFlagAbsolutePosition);
		}
	}

	if(chunkDefinition['lab_flags'] !== undefined) {
		var labFlags = chunkDefinition['lab_flags'];

		var boostFlagPosition = labFlags['boost'];
		if(boostFlagPosition !== undefined) {
			var boostFlagAbsolutePosition = getAbolutePosition(boostFlagPosition, designRootPos, rootPos);
	
			var boostFlagName = '!LABBOOST|' + rootPos.roomName;
	
			boostFlagAbsolutePosition['type'] = 'flag';
			boostFlagAbsolutePosition['flagName'] = boostFlagName;
	
			absolutePositions.push(boostFlagAbsolutePosition);
			//End Boost lab logic
		}

		var componentFlags = labFlags['component'];
		var componentFlagOnePos = componentFlags[0];
		var componentFlagTwoPos = componentFlags[1];
		var componentFlagOneAbsolutePosition = getAbolutePosition(componentFlagOnePos, designRootPos, rootPos);
		var componentFlagTwoAbsolutePosition = getAbolutePosition(componentFlagTwoPos, designRootPos, rootPos);

		var componentFlagOneName = '!LABCOMPONENT1|' + rootPos.roomName;
		var componentFlagTwoName = '!LABCOMPONENT2|' + rootPos.roomName;

		componentFlagOneAbsolutePosition['type'] = 'flag';
		componentFlagOneAbsolutePosition['flagName'] = componentFlagOneName;
		componentFlagTwoAbsolutePosition['type'] = 'flag';
		componentFlagTwoAbsolutePosition['flagName'] = componentFlagTwoName;

		absolutePositions.push(componentFlagOneAbsolutePosition);
		absolutePositions.push(componentFlagTwoAbsolutePosition);
	}

	return absolutePositions;
}

function getAbolutePosition(designPosition, designRootPosition, rootPosition) {
	var relativePosition = {"x":  designPosition['x'] - designRootPosition['x'], "y":  designPosition['y'] - designRootPosition['y']};
	var absolutePosition = {"x": rootPosition['x'] + relativePosition['x'], "y": rootPosition['y'] + relativePosition['y']}

	return absolutePosition;
}

Room.prototype.ensureRoadBuildFlag = function() {
	if(this.controller.level >= 2) {
		var roadFlagName = "!ROADS|" + this.name + "|homeroom"
		if(Game.flags[roadFlagName] === undefined) {
			new RoomPosition(0, 0, this.name).createFlag(roadFlagName)
		}
	}
}

Room.prototype.generateControllerSinkLinkPlan = function() {
	//Check if RCL is at least 6, generate controller links if so

	if(this.controller.level >= 6) {
		//Find storage and place one link below it, along with source flag
		if(this.storage === undefined) {
			console.log("ERROR: Unable to generate controller link plans - room " + this.name + " has no storage");

			return false;
		}
		//Look through tiles near control and place sink flag near it
		var sinkPos = undefined;

		for(var x_mod = -2; x_mod <= 2; x_mod++) {
			for(var y_mod = -2; y_mod <= 2; y_mod++) {
				if(Math.abs(x_mod) != 2 && Math.abs(y_mod) != 2) continue; //Only looking at ring that's 2 squares away from controller

				var pos_to_check = new RoomPosition(this.controller.pos.x + x_mod, this.controller.pos.y + y_mod, this.name);

				if(pos_to_check.lookFor(LOOK_TERRAIN) == 'plain')  {
					sinkPos = pos_to_check;
					break;
				}
			}

			if(sinkPos != undefined) break;
		}

		if(sinkPos == undefined) {
			console.log("ERROR: Unable to generate controller link plans - room " + this.name + " has no valid controller link positions");

			return false;
		}

		//Place flags once everything is calculated

		console.log("Generated Controller Sink Pos for room " + this.name);
		console.log(sinkPos);
		console.log('NEED TO ADD LINK TO BUILD PLAN')
		sinkPos.createFlag("!LINKSINK|" + this.name + "|0");
	}
}

Room.prototype.generateMineralMiningPlan = function() {
	if(this.controller.level >= 6) {
		var mineral = this.find(FIND_MINERALS)[0];
	
		mineral.pos.createFlag('!M|' + this.name + "|" + this.name + "|mineral");

		console.log('NEED TO ADD MINERAL EXTRACTOR TO BUILDING PLAN')
	}
}

Room.prototype.createFunctionalFlags = function() {
	var flagPlan = this.memory.flagPlan;
	for(var x = 0; x < flagPlan.length; x++) {
		var column = flagPlan[x];

		for(var y = 0; y < column.length; y++) {
			var flagName = column[y];

			if(flagName === 'none') continue;
			
			var mapPosition = new RoomPosition(x, y, this.name);

			mapPosition.createFlag(flagName);
		}
	}
}

Room.prototype.killGeneratedPlan = function() {
	var flags = this.find(FIND_FLAGS);

	for(var i = 0; i < flags.length; i++)
	{
		var flag = flags[i];

		if(flag.name.startsWith("!LINK") || flag.name.startsWith("!BAL") || flag.name.startsWith("!LAB")) {
			flag.remove();
		}
	}
}

var chunkSetsByRCL = {
	"8": ["heart", "bigbattery56", "basic_labs", "bigbattery78"],
	"7": ["heart", "bigbattery56", "basic_labs", "bigbattery78"],
	"6": ["heart", "bigbattery56", "basic_labs"],
	"5": ["heart", "bigbattery56"],
	"4": ["heart"],
	"3": ["heart"],
	"2": ["heart"],
	"1": ["heart"],
};

var chunkDefinitions = {
	"heart": {
		"root": {"x": 25, "y": 23},
		"8": {
			"balancer_flags": {
				"balancer_start": [{"x": 25, "y": 22}],
				"balancer_end": [{"x": 26, "y": 27}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 19}],
				"sinks": []
			},
			"harvest_destination": {"x":24,"y":21},
			"buildings":{"storage":{"pos":[{"x":24,"y":21}]},"spawn":{"pos":[{"x":25,"y":23},{"x":26,"y":22},{"x":27,"y":22}]},"extension":{"pos":[{"x":27,"y":23},{"x":26,"y":24},{"x":26,"y":25},{"x":28,"y":23},{"x":28,"y":24},{"x":27,"y":25},{"x":29,"y":24},{"x":29,"y":25},{"x":28,"y":26},{"x":27,"y":26},{"x":30,"y":25},{"x":30,"y":26},{"x":30,"y":27},{"x":29,"y":28},{"x":29,"y":27},{"x":28,"y":28},{"x":27,"y":28},{"x":26,"y":28},{"x":26,"y":26},{"x":25,"y":27}]},"link":{"pos":[{"x":24,"y":19}]},"road":{"pos":[{"x":26,"y":27},{"x":27,"y":27},{"x":28,"y":27},{"x":29,"y":26},{"x":28,"y":25},{"x":27,"y":24},{"x":26,"y":23},{"x":25,"y":22},{"x":24,"y":22},{"x":23,"y":22},{"x":23,"y":21},{"x":23,"y":20},{"x":24,"y":20},{"x":25,"y":20},{"x":25,"y":21},{"x":24,"y":23},{"x":24,"y":24},{"x":24,"y":25},{"x":24,"y":26},{"x":26,"y":21},{"x":27,"y":21},{"x":28,"y":21},{"x":29,"y":22},{"x":30,"y":23}]},"terminal":{"pos":[{"x":23,"y":19}]},"tower":{"pos":[{"x":25,"y":25},{"x":25,"y":26},{"x":25,"y":24},{"x":28,"y":22},{"x":29,"y":23},{"x":30,"y":24}]}}
		},
		"7": {
			"balancer_flags": {
				"balancer_start": [{"x": 25, "y": 22}],
				"balancer_end": [{"x": 26, "y": 27}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 19}],
				"sinks": []
			},
			"harvest_destination": {"x":24,"y":21},
			"buildings":{"storage":{"pos":[{"x":24,"y":21}]},"spawn":{"pos":[{"x":25,"y":23},{"x":26,"y":22}]},"extension":{"pos":[{"x":27,"y":23},{"x":26,"y":24},{"x":26,"y":25},{"x":28,"y":23},{"x":28,"y":24},{"x":27,"y":25},{"x":29,"y":24},{"x":29,"y":25},{"x":28,"y":26},{"x":27,"y":26},{"x":30,"y":25},{"x":30,"y":26},{"x":30,"y":27},{"x":29,"y":28},{"x":29,"y":27},{"x":28,"y":28},{"x":27,"y":28},{"x":26,"y":28},{"x":26,"y":26},{"x":25,"y":27}]},"link":{"pos":[{"x":24,"y":19}]},"road":{"pos":[{"x":26,"y":27},{"x":27,"y":27},{"x":28,"y":27},{"x":29,"y":26},{"x":28,"y":25},{"x":27,"y":24},{"x":26,"y":23},{"x":25,"y":22},{"x":24,"y":22},{"x":23,"y":22},{"x":23,"y":21},{"x":23,"y":20},{"x":24,"y":20},{"x":25,"y":20},{"x":25,"y":21},{"x":24,"y":23},{"x":24,"y":24},{"x":24,"y":25},{"x":24,"y":26},{"x":26,"y":21},{"x":27,"y":21},{"x":28,"y":21},{"x":29,"y":22},{"x":30,"y":23}]},"terminal":{"pos":[{"x":23,"y":19}]},"tower":{"pos":[{"x":25,"y":25},{"x":25,"y":26},{"x":25,"y":24}]}}
		},
		"6": {
			"balancer_flags": {
				"balancer_start": [{"x": 25, "y": 22}],
				"balancer_end": [{"x": 26, "y": 27}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 19}],
				"sinks": []
			},
			"harvest_destination": {"x":24,"y":21},
			"buildings":{"storage":{"pos":[{"x":24,"y":21}]},"spawn":{"pos":[{"x":25,"y":23}]},"extension":{"pos":[{"x":27,"y":23},{"x":26,"y":24},{"x":26,"y":25},{"x":28,"y":23},{"x":28,"y":24},{"x":27,"y":25},{"x":29,"y":24},{"x":29,"y":25},{"x":28,"y":26},{"x":27,"y":26},{"x":30,"y":25},{"x":30,"y":26},{"x":30,"y":27},{"x":29,"y":28},{"x":29,"y":27},{"x":28,"y":28},{"x":27,"y":28},{"x":26,"y":28},{"x":26,"y":26},{"x":25,"y":27}]},"link":{"pos":[{"x":24,"y":19}]},"road":{"pos":[{"x":26,"y":27},{"x":27,"y":27},{"x":28,"y":27},{"x":29,"y":26},{"x":28,"y":25},{"x":27,"y":24},{"x":26,"y":23},{"x":25,"y":22},{"x":24,"y":22},{"x":23,"y":22},{"x":23,"y":21},{"x":23,"y":20},{"x":24,"y":20},{"x":25,"y":20},{"x":25,"y":21},{"x":24,"y":23},{"x":24,"y":24},{"x":24,"y":25},{"x":24,"y":26},{"x":26,"y":21},{"x":27,"y":21},{"x":28,"y":21},{"x":29,"y":22},{"x":30,"y":23}]},"terminal":{"pos":[{"x":23,"y":19}]},"tower":{"pos":[{"x":25,"y":26},{"x":25,"y":24}]}}
		},
		"5": {
			"balancer_flags": {
				"balancer_start": [{"x": 25, "y": 22}],
				"balancer_end": [{"x": 26, "y": 27}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 19}],
				"sinks": []
			},
			"harvest_destination": {"x":24,"y":21},
			"buildings":{"storage":{"pos":[{"x":24,"y":21}]},"spawn":{"pos":[{"x":25,"y":23}]},"extension":{"pos":[{"x":27,"y":23},{"x":26,"y":24},{"x":26,"y":25},{"x":28,"y":23},{"x":28,"y":24},{"x":27,"y":25},{"x":29,"y":24},{"x":29,"y":25},{"x":28,"y":26},{"x":27,"y":26},{"x":30,"y":25},{"x":30,"y":26},{"x":30,"y":27},{"x":29,"y":28},{"x":29,"y":27},{"x":28,"y":28},{"x":27,"y":28},{"x":26,"y":28},{"x":26,"y":26},{"x":25,"y":27}]},"link":{"pos":[{"x":24,"y":19}]},"road":{"pos":[{"x":26,"y":27},{"x":27,"y":27},{"x":28,"y":27},{"x":29,"y":26},{"x":28,"y":25},{"x":27,"y":24},{"x":26,"y":23},{"x":25,"y":22},{"x":24,"y":22},{"x":23,"y":22},{"x":23,"y":21},{"x":23,"y":20},{"x":24,"y":20},{"x":25,"y":20},{"x":25,"y":21},{"x":24,"y":23},{"x":24,"y":24},{"x":24,"y":25},{"x":24,"y":26},{"x":26,"y":21},{"x":27,"y":21},{"x":28,"y":21},{"x":29,"y":22},{"x":30,"y":23}]},"terminal":{"pos":[]},"tower":{"pos":[{"x":25,"y":26},{"x":25,"y":24}]}}
		},
		"4": {
			"balancer_flags": {
				"balancer_start": [{"x": 25, "y": 22}],
				"balancer_end": [{"x": 26, "y": 27}]
			},
			"harvest_destination": {"x":24,"y":21},
			"buildings":{"storage":{"pos":[{"x":24,"y":21}]},"spawn":{"pos":[{"x":25,"y":23}]},"extension":{"pos":[{"x":27,"y":23},{"x":26,"y":24},{"x":26,"y":25},{"x":28,"y":23},{"x":28,"y":24},{"x":27,"y":25},{"x":29,"y":24},{"x":29,"y":25},{"x":28,"y":26},{"x":27,"y":26},{"x":30,"y":25},{"x":30,"y":26},{"x":30,"y":27},{"x":29,"y":28},{"x":29,"y":27},{"x":28,"y":28},{"x":27,"y":28},{"x":26,"y":28},{"x":26,"y":26},{"x":25,"y":27}]},"link":{"pos":[]},"road":{"pos":[{"x":26,"y":27},{"x":27,"y":27},{"x":28,"y":27},{"x":29,"y":26},{"x":28,"y":25},{"x":27,"y":24},{"x":26,"y":23},{"x":25,"y":22},{"x":24,"y":22},{"x":23,"y":22},{"x":23,"y":21},{"x":23,"y":20},{"x":24,"y":20},{"x":25,"y":20},{"x":25,"y":21},{"x":24,"y":23},{"x":24,"y":24},{"x":24,"y":25},{"x":24,"y":26},{"x":26,"y":21},{"x":27,"y":21},{"x":28,"y":21},{"x":29,"y":22},{"x":30,"y":23}]},"terminal":{"pos":[]},"tower":{"pos":[{"x":25,"y":26}]}}
		},
		"3": {
			"balancer_flags": {
				"balancer_start": [{"x": 25, "y": 22}],
				"balancer_end": [{"x": 26, "y": 27}]
			},
			"harvest_destination": {"x":24,"y":21},
			"buildings":{"container":{"pos":[{"x":24,"y":21}]},"spawn":{"pos":[{"x":25,"y":23}]},"extension":{"pos":[{"x":27,"y":23},{"x":26,"y":24},{"x":26,"y":25},{"x":28,"y":23},{"x":28,"y":24},{"x":27,"y":25},{"x":29,"y":24},{"x":29,"y":25},{"x":28,"y":26},{"x":30,"y":25}]},"link":{"pos":[]},"terminal":{"pos":[]},"tower":{"pos":[{"x":25,"y":26}]}}
		},
		"2": {
			"balancer_flags": {
				"balancer_start": [{"x": 25, "y": 22}],
				"balancer_end": [{"x": 26, "y": 27}]
			},
			"buildings":{"spawn":{"pos":[{"x":25,"y":23}]},"extension":{"pos":[{"x":27,"y":23},{"x":26,"y":24},{"x":26,"y":25},{"x":28,"y":23},{"x":28,"y":24}]},"link":{"pos":[]},"terminal":{"pos":[]},"tower":{"pos":[]}}
		},
		"1": {
			"buildings":{"spawn":{"pos":[{"x":25,"y":23}]},"extension":{"pos":[]},"link":{"pos":[]},"road":{"pos":[]},"terminal":{"pos":[]},"tower":{"pos":[]}}
		},

	},
	"sword": {
		"root": {"x": 24, "y": 21},
		"8": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 29, "y": 25}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 17}],
				"sinks": []
			},
			"rcl":"8",
			"buildings":{
				"storage":{"pos":[{"x":23,"y":19}]},
				"spawn":{"pos":[{"x":24,"y":21},{"x":25,"y":20},{"x":24,"y":22}]},
				"extension":{"pos":[{"x":26,"y":21},{"x":26,"y":20},{"x":27,"y":21},{"x":27,"y":22},{"x":28,"y":22},{"x":25,"y":22},{"x":25,"y":23},{"x":26,"y":23},{"x":26,"y":24},{"x":28,"y":23},{"x":27,"y":24},{"x":29,"y":23},{"x":29,"y":24},{"x":27,"y":25},{"x":28,"y":25},{"x":30,"y":24},{"x":30,"y":25},{"x":28,"y":26},{"x":29,"y":26},{"x":30,"y":26}]},
				"road":{"pos":[{"x":29,"y":25},{"x":28,"y":24},{"x":26,"y":22},{"x":25,"y":21},{"x":24,"y":20},{"x":24,"y":19},{"x":24,"y":18},{"x":23,"y":18},{"x":22,"y":18},{"x":22,"y":19},{"x":22,"y":20},{"x":23,"y":20},{"x":23,"y":21},{"x":23,"y":22},{"x":23,"y":23},{"x":25,"y":19},{"x":26,"y":19},{"x":27,"y":19},{"x":27,"y":23}]},
				"tower":{"pos":[{"x":22,"y":17},{"x":21,"y":18},{"x":25,"y":17},{"x":21,"y":21},{"x":26,"y":17},{"x":21,"y":22}]},
				"terminal":{"pos":[{"x":21,"y":20}]},
				"link":{"pos":[{"x":24,"y":17}]},
				"rampart":{"pos":[]}}
		},
		"7": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 29, "y": 25}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 17}],
				"sinks": []
			},
			"rcl":"7",
			"buildings":{
				"storage":{"pos":[{"x":23,"y":19}]},
				"spawn":{"pos":[{"x":24,"y":21},{"x":25,"y":20}]},
				"extension":{"pos":[{"x":26,"y":21},{"x":26,"y":20},{"x":27,"y":21},{"x":27,"y":22},{"x":28,"y":22},{"x":25,"y":22},{"x":25,"y":23},{"x":26,"y":23},{"x":26,"y":24},{"x":28,"y":23},{"x":27,"y":24},{"x":29,"y":23},{"x":29,"y":24},{"x":27,"y":25},{"x":28,"y":25},{"x":30,"y":24},{"x":30,"y":25},{"x":28,"y":26},{"x":29,"y":26},{"x":30,"y":26}]},
				"road":{"pos":[{"x":29,"y":25},{"x":28,"y":24},{"x":26,"y":22},{"x":25,"y":21},{"x":24,"y":20},{"x":24,"y":19},{"x":24,"y":18},{"x":23,"y":18},{"x":22,"y":18},{"x":22,"y":19},{"x":22,"y":20},{"x":23,"y":20},{"x":23,"y":21},{"x":23,"y":22},{"x":23,"y":23},{"x":25,"y":19},{"x":26,"y":19},{"x":27,"y":19},{"x":27,"y":23}]},
				"tower":{"pos":[{"x":25,"y":17},{"x":21,"y":21},{"x":21,"y":22}]},
				"terminal":{"pos":[{"x":21,"y":20}]},
				"link":{"pos":[{"x":24,"y":17}]},
				"rampart":{"pos":[]}
			}
		},
		"6": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 29, "y": 25}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 17}],
				"sinks": []
			},
			"rcl":"6",
			"buildings":{
				"storage":{"pos":[{"x":23,"y":19}]},
				"spawn":{"pos":[{"x":24,"y":21}]},
				"extension":{"pos":[{"x":26,"y":21},{"x":26,"y":20},{"x":27,"y":21},{"x":27,"y":22},{"x":28,"y":22},{"x":25,"y":22},{"x":25,"y":23},{"x":26,"y":23},{"x":26,"y":24},{"x":28,"y":23},{"x":27,"y":24},{"x":29,"y":23},{"x":29,"y":24},{"x":27,"y":25},{"x":28,"y":25},{"x":30,"y":24},{"x":30,"y":25},{"x":28,"y":26},{"x":29,"y":26},{"x":30,"y":26}]},
				"road":{"pos":[{"x":29,"y":25},{"x":28,"y":24},{"x":26,"y":22},{"x":25,"y":21},{"x":24,"y":20},{"x":24,"y":19},{"x":24,"y":18},{"x":23,"y":18},{"x":22,"y":18},{"x":22,"y":19},{"x":22,"y":20},{"x":23,"y":20},{"x":23,"y":21},{"x":23,"y":22},{"x":23,"y":23},{"x":25,"y":19},{"x":26,"y":19},{"x":27,"y":19},{"x":27,"y":23}]},
				"tower":{"pos":[{"x":25,"y":17},{"x":21,"y":21}]},
				"terminal":{"pos":[{"x":21,"y":20}]},
				"link":{"pos":[{"x":24,"y":17}]},
				"rampart":{"pos":[]}
			}
		},
		"5": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 29, "y": 25}]
			},
			"link_flags": {
				"sources": [{"x": 24, "y": 17}],
				"sinks": []
			},
			"rcl":"5",
			"buildings":{
				"storage":{"pos":[{"x":23,"y":19}]},
				"spawn":{"pos":[{"x":24,"y":21}]},
				"extension":{"pos":[{"x":26,"y":21},{"x":26,"y":20},{"x":27,"y":21},{"x":27,"y":22},{"x":28,"y":22},{"x":25,"y":22},{"x":25,"y":23},{"x":26,"y":23},{"x":26,"y":24},{"x":28,"y":23},{"x":27,"y":24},{"x":29,"y":23},{"x":29,"y":24},{"x":27,"y":25},{"x":28,"y":25},{"x":30,"y":24},{"x":30,"y":25},{"x":28,"y":26},{"x":29,"y":26},{"x":30,"y":26}]},
				"road":{"pos":[{"x":29,"y":25},{"x":28,"y":24},{"x":26,"y":22},{"x":25,"y":21},{"x":24,"y":20},{"x":24,"y":19},{"x":24,"y":18},{"x":23,"y":18},{"x":22,"y":18},{"x":22,"y":19},{"x":22,"y":20},{"x":23,"y":20},{"x":23,"y":21},{"x":23,"y":22},{"x":23,"y":23},{"x":25,"y":19},{"x":26,"y":19},{"x":27,"y":19},{"x":27,"y":23}]},
				"tower":{"pos":[{"x":25,"y":17},{"x":21,"y":21}]},
				"link":{"pos":[{"x":24,"y":17}]}
			}
		},
		"4": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 29, "y": 25}]
			},
			"rcl":"4",
			"buildings":{
				"storage":{"pos":[{"x":23,"y":19}]},
				"spawn":{"pos":[{"x":24,"y":21}]},
				"extension":{"pos":[{"x":26,"y":21},{"x":26,"y":20},{"x":27,"y":21},{"x":27,"y":22},{"x":28,"y":22},{"x":25,"y":22},{"x":25,"y":23},{"x":26,"y":23},{"x":26,"y":24},{"x":28,"y":23},{"x":27,"y":24},{"x":29,"y":23},{"x":29,"y":24},{"x":27,"y":25},{"x":28,"y":25},{"x":30,"y":24},{"x":30,"y":25},{"x":28,"y":26},{"x":29,"y":26},{"x":30,"y":26}]},
				"road":{"pos":[{"x":29,"y":25},{"x":28,"y":24},{"x":26,"y":22},{"x":25,"y":21},{"x":24,"y":20},{"x":24,"y":19},{"x":24,"y":18},{"x":23,"y":18},{"x":22,"y":18},{"x":22,"y":19},{"x":22,"y":20},{"x":23,"y":20},{"x":23,"y":21},{"x":23,"y":22},{"x":23,"y":23},{"x":25,"y":19},{"x":26,"y":19},{"x":27,"y":19},{"x":27,"y":23}]},
				"tower":{"pos":[{"x":25,"y":17}]}
			}
		},
		"3": {
			"rcl":"3",
			"buildings":{
				"spawn":{"pos":[{"x":24,"y":21}]},
				"extension":{"pos":[{"x":26,"y":21},{"x":26,"y":20},{"x":27,"y":21},{"x":27,"y":22},{"x":28,"y":22},{"x":25,"y":22},{"x":25,"y":23},{"x":26,"y":23},{"x":26,"y":24},{"x":28,"y":23}]},
				"tower":{"pos":[{"x":25,"y":17}]}
			}
		},
		"2": {
			"rcl":"2",
			"buildings":{
				"spawn":{"pos":[{"x":24,"y":21}]},
				"extension":{"pos":[{"x":26,"y":21},{"x":26,"y":20},{"x":27,"y":21},{"x":25,"y":22},{"x":25,"y":23}]}
			}
		},
		"1": {
			"rcl":"1",
			"buildings":{
				"spawn":{"pos":[{"x":24,"y":21}]}
			}
		}
	},
	"bigbattery56": {
		"root": {"x": 23, "y": 19},
		"default": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 28, "y": 24}]
			},
			"link_flags": {
				"sources": [],
				"sinks": [{"x": 23, "y": 19}]
			},
			"name":"",
			"shard":"shard0",
			"rcl":"5",
			"buildings":{
				"extension":{"pos":[{"x":25,"y":19},{"x":23,"y":21},{"x":25,"y":20},{"x":24,"y":21},{"x":26,"y":20},{"x":26,"y":21},{"x":24,"y":22},{"x":25,"y":22},{"x":27,"y":21},{"x":25,"y":23},{"x":26,"y":23},{"x":28,"y":22},{"x":28,"y":23},{"x":27,"y":24},{"x":29,"y":23},{"x":26,"y":24},{"x":29,"y":24},{"x":28,"y":25},{"x":27,"y":25},{"x":27,"y":22}]},
				"road":{"pos":[{"x":24,"y":20},{"x":25,"y":21},{"x":26,"y":22},{"x":27,"y":23},{"x":28,"y":24}]},
				"link":{"pos":[{"x":23,"y":19}]},
				"container":{"pos":[{"x":24,"y":20}]}
			}
		},
		"5": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 26, "y": 22}]
			},
			"link_flags": {
				"sources": [],
				"sinks": [{"x": 23, "y": 19}]
			},
			"name":"",
			"shard":"shard0",
			"rcl":"5",
			"buildings":{
				"extension":{"pos":[{"x":25,"y":19},{"x":23,"y":21},{"x":25,"y":20},{"x":24,"y":21},{"x":26,"y":20},{"x":26,"y":21},{"x":24,"y":22},{"x":25,"y":22},{"x":27,"y":21},{"x":25,"y":23}]},
				"road":{"pos":[{"x":24,"y":20},{"x":25,"y":21},{"x":26,"y":22}]},
				"link":{"pos":[{"x":23,"y":19}]},
				"container":{"pos":[{"x":24,"y":20}]}
			}
		}
	},
	"bigbattery78": { //Same as big battery 56, but for RCL 7 & 8
		"root": {"x": 23, "y": 19},
		"default": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 28, "y": 24}]
			},
			"link_flags": {
				"sources": [],
				"sinks": [{"x": 23, "y": 19}]
			},
			"name":"",
			"shard":"shard0",
			"rcl":"5",
			"buildings":{
				"extension":{"pos":[{"x":25,"y":19},{"x":23,"y":21},{"x":25,"y":20},{"x":24,"y":21},{"x":26,"y":20},{"x":26,"y":21},{"x":24,"y":22},{"x":25,"y":22},{"x":27,"y":21},{"x":25,"y":23},{"x":26,"y":23},{"x":28,"y":22},{"x":28,"y":23},{"x":27,"y":24},{"x":29,"y":23},{"x":26,"y":24},{"x":29,"y":24},{"x":28,"y":25},{"x":27,"y":25},{"x":27,"y":22}]},
				"road":{"pos":[{"x":24,"y":20},{"x":25,"y":21},{"x":26,"y":22},{"x":27,"y":23},{"x":28,"y":24}]},
				"link":{"pos":[{"x":23,"y":19}]},
				"container":{"pos":[{"x":24,"y":20}]}
			}
		},
		"7": {
			"balancer_flags": {
				"balancer_start": [{"x": 24, "y": 20}],
				"balancer_end": [{"x": 26, "y": 22}]
			},
			"link_flags": {
				"sources": [],
				"sinks": [{"x": 23, "y": 19}]
			},
			"name":"",
			"shard":"shard0",
			"rcl":"5",
			"buildings":{
				"extension":{"pos":[{"x":25,"y":19},{"x":23,"y":21},{"x":25,"y":20},{"x":24,"y":21},{"x":26,"y":20},{"x":26,"y":21},{"x":24,"y":22},{"x":25,"y":22},{"x":27,"y":21},{"x":25,"y":23}]},
				"road":{"pos":[{"x":24,"y":20},{"x":25,"y":21},{"x":26,"y":22}]},
				"link":{"pos":[{"x":23,"y":19}]},
				"container":{"pos":[{"x":24,"y":20}]}
			}
		}
	},
	"basic_labs": {
		"root": {"x": 23, "y": 21},
		"8": {
			"lab_flags": {
				"boost": {"x": 21, "y": 22},
				"component": [{"x": 23, "y": 20}, {"x": 23, "y": 22}]
			},
			"buildings":{"lab":{"pos":[{"x":22,"y":20},{"x":22,"y":22},{"x":24,"y":20},{"x":24,"y":22},{"x":23,"y":22},{"x":23,"y":20},{"x":21,"y":22},{"x":21,"y":20},{"x":25,"y":22},{"x":25,"y":20}]},"road":{"pos":[{"x":21,"y":21},{"x":22,"y":21},{"x":23,"y":21},{"x":24,"y":21},{"x":26,"y":21},{"x":25,"y":21},{"x":20,"y":21}]}}
		},
		"7": {
			"lab_flags": {
				"boost": {"x": 22, "y": 22},
				"component": [{"x": 23, "y": 20}, {"x": 23, "y": 22}]
			},
			"buildings":{"lab":{"pos":[{"x":22,"y":20},{"x":22,"y":22},{"x":24,"y":20},{"x":24,"y":22},{"x":23,"y":22},{"x":23,"y":20}]},"road":{"pos":[{"x":21,"y":21},{"x":22,"y":21},{"x":23,"y":21},{"x":24,"y":21},{"x":25,"y":21}]}}
		},
		"6": {
			"lab_flags": {
				"component": [{"x": 22, "y": 22}, {"x": 24, "y": 22}]
			},
			"buildings":{"lab":{"pos":[{"x":22,"y":22},{"x":24,"y":22},{"x":23,"y":20}]},"road":{"pos":[{"x":22,"y":21},{"x":23,"y":21},{"x":24,"y":21}]}}
		}
	},
	"battery": { //Old design - uses too many balancers
		"root": {"x": 23, "y": 16},
		"default": {
			"balancer_flags": {
				"balancer_start": [{"x": 22, "y": 17}],
				"balancer_end": [{"x": 21, "y": 18}]
			},
			"link_flags": {
				"sources": [],
				"sinks": [{"x": 23, "y": 16}]
			},
			"rcl":"8",
			"buildings":{
				"storage":{"pos":[]},
				"road":{"pos":[{"x":21,"y":18},{"x":22,"y":17},{"x":20,"y":19}]},
				"extension":{"pos":[{"x":21,"y":19},{"x":20,"y":18},{"x":22,"y":19},{"x":20,"y":17},{"x":23,"y":18},{"x":22,"y":18},{"x":21,"y":17},{"x":21,"y":16},{"x":23,"y":17},{"x":22,"y":16}]},
				"link":{"pos":[{"x":23,"y":16}]},
				"container":{"pos":[{"x":22,"y":17}]}
			}
		}
	}
};