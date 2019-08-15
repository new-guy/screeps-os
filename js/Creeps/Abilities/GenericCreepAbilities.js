Creep.prototype.putEnergyInTarget = function() {
    var target = this.getTarget();

    if(target.energy === target.energyCapacity) {
        this.clearTarget();
    }

    else if(this.pos.getRangeTo(target) > 1) {
        this.moveTo(target, {visualizePathStyle: {stroke: "#881", opacity: .2}});
    }

    else {
        var transferResult = this.transfer(target, RESOURCE_ENERGY);

        if(transferResult === 0) {
            this.clearTarget();
        }

        else {
            this.say(transferResult);
        }
    }
}

Creep.prototype.buildTarget = function() {
    var target = this.getTarget();

    if(this.pos.getRangeTo(target) === 0) {
        this.moveRandom();        
        this.say('Move');
    }

    else {
        if(this.pos.getRangeTo(target) > 2) {
            this.moveTo(target, {visualizePathStyle: {stroke: "#1c1", opacity: .3}});
        }

        if(this.pos.getRangeTo(target) <= 3) {
            var buildResult = this.build(target);
    
            if(buildResult === 0 && this.carry[RESOURCE_ENERGY] === 0) {
                this.clearTarget();
            }
    
            else {
                this.say(buildResult);
            }
        }
    }
}

Creep.prototype.moveRandom = function() {
    var moveOptions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];

    var moveDirection = moveOptions[Math.floor(Math.random() * moveOptions.length)];

    this.move(moveDirection);
}