Room.prototype.hasNoBuildingSlots = function(structureType) {
	var rcl = this.controller.level;
	var structureCountMax = CONTROLLER_STRUCTURES[structureType][rcl];
	var builtStructCount = _.countBy(this.find(FIND_MY_STRUCTURES), function(structure){return structure.structureType === structureType})["true"];

	if (builtStructCount === undefined) builtStructCount = 0;

	return builtStructCount == structureCountMax;
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

var WORK_PARTS_FOR_SAFE = 5;
var MINIMUM_ENERGY_FOR_SAFE = 10000;

Room.prototype.isInComa = function() {
	if(this.controller === undefined || !this.controller.my) {
		return false;
	}

	if(this.storage === undefined) {
		var workPartCount = 0;

		console.log('sup')

		for(var i = 0; i < this.friendlies.length; i++) {
			var creep = this.friendlies[i];

			console.log(creep.name);

			var workParts = _.filter(creep.body, function(part) { return part.type === 'work' }).length;

			workPartCount += workParts;
		}

		return workPartCount < WORK_PARTS_FOR_SAFE;
	}

	else  {
		return this.storage.energy < MINIMUM_ENERGY_FOR_SAFE;
	}
}