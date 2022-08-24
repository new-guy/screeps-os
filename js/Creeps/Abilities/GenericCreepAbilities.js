Creep.prototype.putEnergyInTarget = function() {
    var target = this.getTarget();
    this.say('🚛')


    if(target == null ||
       (target.store == null && target.carryCapacity == null && target.energy === target.energyCapacity) ||
       (target.store != null && target.store[RESOURCE_ENERGY] == target.store.getCapacity(RESOURCE_ENERGY)) ||
       (target.carryCapacity != null && target.carry[RESOURCE_ENERGY] === target.carryCapacity) ||
       this.hasNoEnergy) {
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
        this.say('🚶');
    }

    else {
        if(this.pos.getRangeTo(target) > 2) {
            this.moveTo(target, {visualizePathStyle: {stroke: "#1c1", opacity: .3}});
        }

        if(this.pos.getRangeTo(target) <= 3) {
            var buildResult = this.build(target);
    
            if(buildResult === 0 && this.hasNoEnergy) {
                this.clearTarget();
            }
    
            else {
                this.sayInOrder(['Let\'s', 'get', 'this', 'bread']);
            }
        }
    }
}

Creep.prototype.repairTarget = function() {
    var target = this.getTarget();

    if(this.pos.getRangeTo(target) === 0) {
        this.moveRandom();
        this.say('🚶');
    }

    else {
        if(target == null || target.hits == target.hitsMax) {
            this.clearTarget();
            return;
        }

        if(this.pos.getRangeTo(target) > 1) {
            this.moveTo(target, {visualizePathStyle: {stroke: "#333", opacity: .3}});
            this.say('🛻')
        }

        if(this.pos.getRangeTo(target) <= 3) {
            var repairResult = this.repair(target);
    
            if(repairResult === 0 && this.hasNoEnergy) {
                this.clearTarget();
            }
    
            else {
                this.say('🔧');
            }
        }
    }
}

Creep.prototype.moveRandom = function() {
    var moveOptions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];

    var moveDirection = moveOptions[Math.floor(Math.random() * moveOptions.length)];

    this.move(moveDirection);
}

Creep.prototype.getEnergyFromHarvestDestination = function(room) {
    var harvestDestination = room.harvestDestination;

    if(harvestDestination == null) {
        this.say('NoStorage');
        return;
    }

    else {
        if(this.pos.getRangeTo(harvestDestination) > 1) {
            this.moveTo(harvestDestination);
        }

        else {
            this.withdraw(harvestDestination, RESOURCE_ENERGY);
        }
    }
}

Creep.prototype.getEnergyFromClosestColonyHarvestDestination = function(colony, hasMinimum=false) {
    //hasMinimum checks your ROOM_NECESSARY_MINIMUM_ENERGY_CONTAINER
    var harvestDestination = colony.getClosestHarvestDestination(this.pos, this.carryCapacity, hasMinimum);

    if(harvestDestination == null) {
        this.say('NoStorage');
        return;
    }

    else {
        if(this.pos.getRangeTo(harvestDestination) > 1) {
            this.moveTo(harvestDestination);
        }

        else {
            this.withdraw(harvestDestination, RESOURCE_ENERGY);
        }
    }
}

Creep.prototype.moveToRoom = function(roomName) {
    var targetController = Game.rooms[roomName].controller;
    this.moveTo(targetController)
    this.sayInOrder(['Returning', 'to', 'room', roomName])
}

Creep.prototype.returnToTargetRoom = function() {
    this.moveToRoom(this.memory.targetRoom)
    this.sayInOrder(['Returning', 'to', 'target', 'room'])
}

Creep.prototype.meleeMoveTo = function(pos) {
    var ret = PathFinder.search(
        this.pos, pos,
        {
            plainCost: 1,
            swampCost: 5,
            maxRooms: 1,
    
            roomCallback: function(roomName) {
                let room = Game.rooms[roomName];
                if (!room) return;
                let costs = new PathFinder.CostMatrix;
        
                room.find(FIND_STRUCTURES).forEach(function(struct) {
                    if ((struct.structureType === STRUCTURE_RAMPART && !struct.my) || struct.structureType === STRUCTURE_WALL) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, struct.hits/30); //30 HP per melee attack
                    }
                });
        
                room.find(FIND_CREEPS).forEach(function(creep) {
                    if (!creep.my) {
                        // Can't walk through non-walkable buildings
                        costs.set(creep.pos.x, creep.pos.y, creep.hits/30); //30 HP per melee attack
                    }
                    else {
                        costs.set(creep.pos.x, creep.pos.y, 0xff)
                    }
                });
        
                return costs;
            },
        }
    );

    if(this.room.name === pos.roomName) {
        var lastPos = {x: 0, y: 0}
        for(var i = 0; i < ret.path.length; i++) {
            var step = ret.path[i];
            var stepx = 0;
            var stepy = 0;
            if(step.x == null) {
                stepx = lastPos.x + step.dx;
                stepy = lastPos.y + step.dy;
            }
            else {
                stepx = step.x,
                stepy = step.y
            }
            new RoomVisual(this.room.name).circle(stepx, stepy, {opacity: 0.3, radius: 0.2, fill: '#ffcc00'})

            lastpos = {
                x: stepx,
                y: stepy
            };

        }
    }

    this.moveByPath(ret.path);
}