var SAVE_LOWER_THRESHOLD = 6000;
var SAVE_UPPER_THRESHOLD = 9000;

StructureController.prototype.needsSaving = function() {
    return this.my && this.ticksToDowngrade < SAVE_LOWER_THRESHOLD;
}

Creep.prototype.upgradeThisController = function(controller) {
    if(this.pos.getRangeTo(controller) <= 3) {
        this.say('inrange');
        this.upgradeController(controller);
    }

    else {
        this.moveTo(controller);
    }
}