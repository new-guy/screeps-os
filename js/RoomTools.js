Room.prototype.hasNoBuildingSlots = function(structureType) {
	var rcl = this.controller.level;
	var structureCountMax = CONTROLLER_STRUCTURES[structureType][rcl];
	var builtStructCount = _.countBy(this.find(FIND_MY_STRUCTURES), function(structure){return structure.structureType === structureType})["true"];

	if (builtStructCount == null) builtStructCount = 0;

	return builtStructCount == structureCountMax;
}

Room.prototype.hasLoneInvaderCore = function() {
	return this.getInvaderStructures().length === 1;
}

Room.prototype.hasInvaderBase = function() {
	return this.getInvaderStructures().length > 1;
}

Room.prototype.hasInvaderStructures = function() {
	return this.getInvaderStructures().length > 0;
}

Room.prototype.getInvaderStructures = function() {
	var invaderBase = this.find(FIND_STRUCTURES, {
		filter: function(object) {
			if(object.owner == null) return false;
			return object.owner.username === 'Invader';
	 	}
	});

	return invaderBase;
}

Room.prototype.hasInvaders = function() {
	if(this.enemies == null) return false;
	var invaders = _.filter(this.enemies, function(r) { 
		return r.owner.username === 'Invader' });

	return invaders.length > 0;
}

Room.prototype.hasZeroBuildingSlots = function(structureType) {
	var rcl = this.controller.level;
	var structureCountMax = CONTROLLER_STRUCTURES[structureType][rcl];

	return structureCountMax === 0;
}

Room.prototype.getPlainsPercentage = function() {
	var tilesInRoom = 2500;
	var numPlains = 0;

	for(var x = 0; x < 49; x++) {
		for(var y = 0; y < 49; y++) {
			if(this.getTerrain().get(x, y) === 0) {
				numPlains++;
			}
		}
	}

	return numPlains/tilesInRoom;
}

Room.prototype.hasNecessaryMinimumEnergy = function() {
	var harvestDest = this.harvestDestination;

	if(harvestDest != null) {
		if(harvestDest.structureType === STRUCTURE_CONTAINER) {
			return harvestDest.store[RESOURCE_ENERGY] > ROOM_NECESSARY_MINIMUM_ENERGY_CONTAINER;
		}
		if(harvestDest.structureType === STRUCTURE_STORAGE) {
			return harvestDest.store[RESOURCE_ENERGY] > ROOM_NECESSARY_MINIMUM_ENERGY_STORAGE;
		}
	}
	else {
		return false;
	}
}

Room.prototype.isInComa = function() {
	if(this.controller == null || !this.controller.my) {
		return false;
	}

	if(this.harvestDestination == null || this.harvestDestination.structureType === STRUCTURE_CONTAINER) {
		var workPartCount = 0;

		for(var i = 0; i < this.friendlies.length; i++) {
			var creep = this.friendlies[i];

			var workParts = _.filter(creep.body, function(part) { return part.type === 'work' }).length;

			workPartCount += workParts;
		}

		return workPartCount < COMA_WORK_PARTS_FOR_SAFE;
	}

	else if(this.harvestDestination.structureType === STRUCTURE_STORAGE) {
		return this.harvestDestination.store[RESOURCE_ENERGY] < COMA_MINIMUM_ENERGY_FOR_SAFE;
	}

	else return true;
}

Room.prototype.removeAllConstructionSites = function(structureType=null) {
	if(this.constructionSites == null) return;

	for(var i = 0; i < this.constructionSites.length; i++) {
		var constructionSite = this.constructionSites[i];

		if(constructionSite.progress > 0) continue;

		if(structureType == null) {
			constructionSite.remove();
		}

		else if(constructionSite.structureType === structureType) {
			constructionSite.remove();
		}
	}
}

Room.prototype.hasEnergyInHarvestDestination = function(energyNeeded, hasMinimum=false) {
	var hasEnergy = (this.harvestDestination != null &&
	(energyNeeded == null || this.harvestDestination.store[RESOURCE_ENERGY] >= energyNeeded));
	if(hasMinimum) {
		hasEnergy = hasEnergy && this.hasNecessaryMinimumEnergy();
	}
	return hasEnergy;
}

Room.prototype.getMostBuiltConstructionSite = function() {
	this.mostBuiltConstructionSite = this.constructionSites[0];

	for(var i = 0; i < this.constructionSites.length; i++) {
		var constructionSite = this.constructionSites[i];

		if(constructionSite.progress > this.mostBuiltConstructionSite.progress) {
			this.mostBuiltConstructionSite = constructionSite;
		}
	}

	return this.mostBuiltConstructionSite;
}

Room.prototype.getSourceLinks = function() {
	var sourceLinkFlags = this.find(FIND_FLAGS, {
		filter: function(object) {
			return object.name.startsWith('!LINKSOURCE');
		}	
	});

	var sourceLinks = [];

	for(var i = 0; i < sourceLinkFlags.length; i++) {
		var flag = sourceLinkFlags[i];
		var link = flag.pos.getStructure(STRUCTURE_LINK);
		
		if(link != null) sourceLinks.push(link);
	}

	return sourceLinks;
}

Room.prototype.getSinkLinks = function() {
	var sinkLinkFlags = this.find(FIND_FLAGS, {
		filter: function(object) {
			return object.name.startsWith('!LINKSINK');
		}	
	});

	var sinkLinks = [];

	for(var i = 0; i < sinkLinkFlags.length; i++) {
		var flag = sinkLinkFlags[i];
		var link = flag.pos.getStructure(STRUCTURE_LINK);
		
		if(link != null) sinkLinks.push(link);
	}

	return sinkLinks;
}

Room.prototype.hasHeart = function() {
	return Game.flags['!CHUNK|heart|' + this.name] != null;
}

Room.prototype.getHeartPos = function() {
	if(Game.flags['!CHUNK|heart|' + this.name] == null) return null;
	return Game.flags['!CHUNK|heart|' + this.name].pos;
}

Room.prototype.canPlaceHeart = function() {
	var middleOfRoom = new RoomPosition(24, 24, this.name);
	var flagPosition = this.findRootForChunk('heart', middleOfRoom, HEART_MAX_DISTANCE);

	if(flagPosition == null) {
		return false;
	}
	else {
		return true;
	}
}

Room.prototype.placeHeart = function() {
	var middleOfRoom = new RoomPosition(24, 24, this.name);
	var flagPosition = this.findRootForChunk('heart', middleOfRoom, HEART_MAX_DISTANCE);

	if(flagPosition == null) {
		console.log('CANNOT FIND PLACE FOR INTIAL HEART IN ' + this.name);
		return false;
	}
	else {
		flagPosition.createFlag('!CHUNK|heart|' + this.name, COLOR_RED);
		return true;
	}
}

Room.prototype.setColony = function(colonyName) {
	var currentColonyName = this.memory.colonyName;
	if(currentColonyName != null) {
		var colony = Game.colonies[currentColonyName];
		if(colony != null) {
			colony.colonyRoomInfo[this.name] = undefined;
		}
	}
	this.memory.colonyName = colonyName;
}