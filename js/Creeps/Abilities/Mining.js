Creep.prototype.harvestFrom = function(target) {
    if(this.pos.getRangeTo(target) > 1) {
        this.moveTo(target);
    }

    else {
        this.harvest(target);
    }
}