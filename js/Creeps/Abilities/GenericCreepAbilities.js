Creep.prototype.putEnergyInTarget = function() {
    var target = this.getTarget();

    if(target.energy === target.energyCapacity) {
        this.clearTarget();
    }

    else if(this.pos.getRangeTo(target) > 1) {
        this.moveTo(target);
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

    if(this.pos.getRangeTo(target) > 1) {
        this.moveTo(target);
    }

    else {
        var buildResult = this.build(target);

        if(buildResult === 0) {
            this.clearTarget();
        }

        else {
            this.say(buildResult);
        }
    }
}