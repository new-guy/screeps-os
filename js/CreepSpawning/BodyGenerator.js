var BodyTypes = require('BodyTypes');

exports.generateBody = function(creepBodyType, availableEnergy)
{
    var bodyDefinition = BodyTypes[creepBodyType];
	var segment = bodyDefinition.segment;
	var bodyArray = segment;

	var shouldRun = true;
	while(shouldRun)
	{
		var segmentToAdd = getSegmentToAdd(segment, bodyDefinition.max, bodyArray);

		if(segmentToAdd.length === 0)
		{
			shouldRun = false;
			continue;
		}
		
		var costOfSegment = getCostOfBody(segment);
		var costOfCurrentBody = getCostOfBody(bodyArray);

		if(costOfSegment + costOfCurrentBody > availableEnergy)
		{
			shouldRun = false;
			continue;
		}

		else
			bodyArray = bodyArray.concat(segmentToAdd);
	}

	bodyArray = _.sortBy(bodyArray, function (e) {
		switch (e) {
			case TOUGH:
				return -1;
			case ATTACK:
				return 4;
			case RANGED_ATTACK:
				return 3;
			case WORK:
				return 5;
			case CARRY:
				return 6;
			case MOVE:
				return 9;
			case HEAL:
				return 10;
			default:
				return 1;
		}
	});

	return bodyArray;
}

function getSegmentToAdd(segmentDef, maximumDef, bodyArray)
{
	var segment = [];

	for(var i = 0; i < segmentDef.length; i++)
	{
		var bodyPart = segmentDef[i];

		if(getBodyPartCount(bodyPart, bodyArray) < maximumDef[bodyPart])
		{
			segment.push(bodyPart);
		}
	}

	return segment;
}

function getBodyPartCount(partToCount, bodyArray)
{
	var count = 0;

	_.forEach(bodyArray, function(part) {
		if(part === partToCount) count += 1;
	});

	return count;
}

exports.getCostOfBody = getCostOfBody;
function getCostOfBody(body) {
	var cost = 0;
	_.forEach(body, function(part) { cost += BODYPART_COST[part]; });

	return cost;
}

exports.getTicksToSpawn = getTicksToSpawn;
function getTicksToSpawn(body) {
    return (body.length * CREEP_SPAWN_TIME) + 1;
}