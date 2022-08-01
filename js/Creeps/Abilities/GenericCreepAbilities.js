Creep.prototype.putEnergyInTarget = function() {
    var target = this.getTarget();
    this.sayInOrder(['Knock', 'knock', 'delivery', 'here!']);

    if((target.store === undefined && target.carryCapacity === undefined && target.energy === target.energyCapacity) ||
       (target.store !== undefined && target.store[RESOURCE_ENERGY] == target.store.getCapacity(RESOURCE_ENERGY)) ||
       (target.carryCapacity !== undefined && target.carry[RESOURCE_ENERGY] === target.carryCapacity) ||
       this.carry[RESOURCE_ENERGY] === 0) {
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
                this.sayInOrder(['Let\'s', 'get', 'that', 'bread']);
            }
        }
    }
}

Creep.prototype.repairTarget = function() {
    var target = this.getTarget();

    if(this.pos.getRangeTo(target) === 0) {
        this.moveRandom();
        this.say('Move');
    }

    else {
        if(target === null || target.hits == target.hitsMax) {
            this.clearTarget();
            return;
        }

        if(this.pos.getRangeTo(target) > 1) {
            this.moveTo(target, {visualizePathStyle: {stroke: "#333", opacity: .2}});
        }

        if(this.pos.getRangeTo(target) <= 3) {
            var repairResult = this.repair(target);
    
            if(repairResult === 0 && this.carry[RESOURCE_ENERGY] === 0) {
                this.clearTarget();
            }
    
            else {
                this.say('Rep');
            }
        }
    }
}

Creep.prototype.moveRandom = function() {
    var moveOptions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];

    var moveDirection = moveOptions[Math.floor(Math.random() * moveOptions.length)];

    this.move(moveDirection);
}

Creep.prototype.getEnergyFromStorage = function(room) {
    var storage = room.storage;

    if(storage === undefined) {
        this.say('NoStorage');
        return;
    }

    else {
        if(this.pos.getRangeTo(storage) > 1) {
            this.moveTo(storage);
        }

        else {
            this.withdraw(storage, RESOURCE_ENERGY);
        }
    }
}

Creep.prototype.getEnergyFromClosestColonyStorage = function(colony) {
    var storage = colony.getClosestStorage(this.pos, this.carryCapacity);

    if(storage === undefined) {
        this.say('NoStorage');
        return;
    }

    else {
        if(this.pos.getRangeTo(storage) > 1) {
            this.moveTo(storage);
        }

        else {
            this.withdraw(storage, RESOURCE_ENERGY);
        }
    }
}