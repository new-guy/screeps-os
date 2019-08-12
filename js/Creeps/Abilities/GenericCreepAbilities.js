Creep.prototype.putEnergyInTarget = function() {
    var target = this.getTarget();

    if(this.pos.getRangeTo(target) > 1) {
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