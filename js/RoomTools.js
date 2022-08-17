Room.prototype.hasNoBuildingSlots = function(structureType) {
	var rcl = this.controller.level;
	var structureCountMax = CONTROLLER_STRUCTURES[structureType][rcl];
	var builtStructCount = _.countBy(this.find(FIND_MY_STRUCTURES), function(structure){return structure.structureType === structureType})["true"];

	if (builtStructCount === undefined) builtStructCount = 0;

	return builtStructCount == structureCountMax;
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

	if(harvestDest !== undefined && harvestDest !== null) {
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
	if(this.controller === undefined || !this.controller.my) {
		return false;
	}

	if(this.harvestDestination === undefined || this.harvestDestination.structureType === STRUCTURE_CONTAINER) {
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

Room.prototype.removeAllConstructionSites = function(structureType=undefined) {
	if(this.constructionSites === undefined) return;

	for(var i = 0; i < this.constructionSites.length; i++) {
		var constructionSite = this.constructionSites[i];

		if(constructionSite.progress > 0) continue;

		if(structureType === undefined) {
			constructionSite.remove();
		}

		else if(constructionSite.structureType === structureType) {
			constructionSite.remove();
		}
	}
}

Room.prototype.hasEnergyInHarvestDestination = function(energyNeeded, hasMinimum=false) {
	var hasEnergy = (this.harvestDestination !== undefined &&
	(energyNeeded === undefined || this.harvestDestination.store[RESOURCE_ENERGY] >= energyNeeded));
	if(hasMinimum) {
		hasEnergy = hasEnergy && this.hasNecessaryMinimumEnergy();
	}
	return hasEnergy;
}

Room.prototype.getMostBuildConstructionSite = function() {
	room.mostBuiltConstructionSite = room.constructionSites[0];

	for(var i = 0; i < room.constructionSites.length; i++) {
		var constructionSite = room.constructionSites[i];

		if(constructionSite.progress > room.mostBuiltConstructionSite.progress) {
			room.mostBuiltConstructionSite = constructionSite;
		}
	}
}