Creep.prototype.harvestFrom = function(target) {
    this.sayInOrder(['There\'s', 'gold', 'in', 'them', 'there', 'hills!']);
    if(this.pos.getRangeTo(target) > 1) {
        this.moveTo(target, {visualizePathStyle: {stroke: "#dd0", opacity: .3}});
    }

    else {
        this.harvest(target);
    }
}