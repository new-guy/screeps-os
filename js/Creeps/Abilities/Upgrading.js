var SAVE_LOWER_THRESHOLD = 3000;
var SAVE_UPPER_THRESHOLD = 4000;

StructureController.prototype.needsSaving = function() {
    return this.my && this.ticksToDowngrade < SAVE_LOWER_THRESHOLD;
}

Creep.prototype.upgradeThisController = function(controller) {
    if(this.pos.getRangeTo(controller) <= 3 && this.hasEnergy) {
        this.sayInOrder(['Praise', 'the', 'sun', '!!!']);
        this.upgradeController(controller);
    }

    else if(this.hasNoEnergy) {
        this.say('Tank\'s Dry')
        this.clearTarget();
    }

    if(this.pos.getRangeTo(controller) > 2) {
        this.moveTo(controller, {visualizePathStyle: {stroke: "#2dd", opacity: .3}});
    }
}