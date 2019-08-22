exports.initForTick = function()
{
	Memory.stats = {};
}

exports.update = function()
{
	var empireEnergy = 0;
	var empireResources = {};
	Memory.stats.rooms = {};

	for(var roomName in Game.rooms)
	{
		var room = Game.rooms[roomName];

		if(room.controller !== undefined && room.controller.my && room.controller.level > 0)
		{
			Memory.stats.rooms[roomName] = {
				RCL: {
					level: room.controller.level,
					progress: room.controller.progress,
					progressTotal: room.controller.progressTotal
				}
			};

			if(room.storage !== undefined) {
				Memory.stats.rooms[roomName]['Storage'] = room.storage.store;

				for(var resourceType in room.storage.store) {
					if(resourceType === RESOURCE_ENERGY) empireEnergy += room.storage.store[resourceType];
					else {
						if(empireResources[resourceType] === undefined) empireResources[resourceType] = room.storage.store[resourceType];
						else empireResources[resourceType] += room.storage.store[resourceType];
					}
				}
			}

			if(room.terminal !== undefined) {
				Memory.stats.rooms[roomName]['Terminal'] = room.terminal.store;

				for(var resourceType in room.terminal.store) {
					if(resourceType === RESOURCE_ENERGY) empireEnergy += room.terminal.store[resourceType];
					else
					{
						if(empireResources[resourceType] === undefined) empireResources[resourceType] = room.terminal.store[resourceType];
						else empireResources[resourceType] += room.terminal.store[resourceType];
					}
				}
			}
		}
	}

	Memory.stats.resources = empireResources;
	Memory.stats.energy = empireEnergy;

	Memory.stats.cpu = {
		limit: Game.cpu.limit,
		tickLimit: Game.cpu.tickLimit,
		bucket: Game.cpu.bucket,
		used: Game.cpu.getUsed()
	};

	Memory.stats.empire = {
		creeps: Object.keys(Game.creeps).length,
		creepTypeCount: getCreepTypeCount()
	};

	var prefix = Game.shard.name;

	if(prefix === '') prefix = 'private';

	var stats = {}
	stats[prefix] = Memory.stats;

	RawMemory.segments[99] = JSON.stringify(stats);
}

function getCreepTypeCount()
{
	var creepTypes = {};

	for(var creepName in Game.creeps)
	{
		var creep = Game.creeps[creepName];

		if(creep.spawning) continue;

		var role = creep.memory.creepProcessClass;
		if(creepTypes[role] === undefined)
		{
			creepTypes[role] = 1;
		}

		else
		{
			creepTypes[role] = creepTypes[role] + 1;
		}
	}

	return creepTypes;
}