Creep.prototype.getTarget = function()
{
	var targetId = this.memory.targetId;
	
	return Game.getObjectById(targetId);
}

Creep.prototype.setTarget = function(target)
{
	if(target === null)
	{
		this.memory.targetId = '';
		return;
	}

	if(target === undefined)
	{
		this.memory.targetId = '';
		return;
	}
	
	this.memory.targetId = target.id;
}

Creep.prototype.clearTarget = function()
{
	this.memory.targetId = '';
}

Creep.prototype.hasTarget = function()
{
	var TARGET_ID_EXISTS = (this.memory.targetId !== undefined) && (this.memory.targetId !== '');
	var TARGET_EXISTS = Game.getObjectById(this.memory.targetId)
	return TARGET_ID_EXISTS && TARGET_EXISTS;
}

Creep.prototype.hasTargetOfClass = function(targetClass)
{
    if(!this.hasTarget()) return false;

    else {
        var target = this.getTarget();

        return target instanceof targetClass;
    }
}

Creep.prototype.moveToTarget = function()
{
	var target = this.getTarget();
	
	if(target === null) return;
	
	this.moveTo(target.pos);
}

Creep.prototype.isNearToTarget = function()
{
	var target = this.getTarget();

	if(target === null) return false;

	return this.pos.isNearTo(target);
}