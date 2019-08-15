Creep.prototype.harvestFrom = function(target) {
    if(this.pos.getRangeTo(target) > 1) {
        this.moveTo(target, {visualizePathStyle: {stroke: "#dd0", opacity: .3}});
    }

    else {
        this.harvest(target);
    }
}