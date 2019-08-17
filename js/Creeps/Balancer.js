const CreepProcess = require('CreepProcess');

class Balancer extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.targetRoom = Game.rooms[this.creep.memory['targetRoom']];
            this.startFlag = Game.flags[this.creep.memory['startFlagName']];
            this.endFlag = Game.flags[this.creep.memory['endFlagName']];
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        
        if(this.creep.memory.hasInitialized !== true) {
            this.calculatePaths();
            this.setEnergySource();
            this.setBufferContainer();

            this.creep.memory.hasInitialized = true;
        }
    }

    updateStateTransitions() {
        if(this.creep.memory.state === undefined)
        {
            this.creep.memory.state = "pickup";
        }
    
        if(this.creep.memory.state === "pickup")
        {
            if(this.creep.isFull())
            {
                this.creep.clearTarget();
                
                this.creep.memory.state = "fill";
            }
        }
    
        if(this.creep.memory.state === "fill")
        {
            if(this.creep.isEmpty())
            {
                this.creep.clearTarget();
                
                this.creep.memory.state = "pickup";
            }
        }
    }

    performStateActions() {
        this.creep.say(this.creep.memory.state);
        if(this.creep.room.name !== this.targetRoom.name) {
            this.creep.say('homebound');
            this.creep.moveTo(new RoomPosition(25, 25, this.targetRoom.name));
            return;
        }

        if(this.creep.memory.state === undefined)
        {
            this.creep.memory.state = "pickup";
        }
    
        if(this.creep.memory.state === "pickup")
        {
            this.pickupEnergy();
        }
    
        if(this.creep.memory.state === "fill")
        {
            this.fillBalancers();
        }
    }

    pickupEnergy() {
        var energySource = Game.getObjectById(this.creep.memory.energySourceId);
        var bufferContainer = Game.getObjectById(this.creep.memory.bufferContainerId);
        var inboundPath = this.creep.memory.inboundPath;

        var finalPosInPath = inboundPath[inboundPath.length-1]

        if(energySource == null) {
            this.setEnergySource();
            energySource = Game.getObjectById(this.creep.memory.energySourceId);
            return;
        }

        if(this.creep.pos.x === finalPosInPath.x && this.creep.pos.y === finalPosInPath.y) {
            var sourceToWithdrawFrom = energySource;

            if(bufferContainer != null && bufferContainer.store[RESOURCE_ENERGY] > 0 && energySource.energy == 0) {
                sourceToWithdrawFrom = bufferContainer;
            }

            this.creep.withdraw(sourceToWithdrawFrom, RESOURCE_ENERGY);
        }

        else {
            this.moveAlongBalancerPath(inboundPath);
        }
    }

    moveAlongBalancerPath(path) {
        var roomPosPath = [];

        for(var i = 0; i < path.length; i++) {
            var pos = new RoomPosition(path[i].x, path[i].y, path[i].roomName);

            roomPosPath.push(pos);
        }

        var moveResult = this.creep.moveByPath(roomPosPath);
        var finalPosInPath = path[path.length-1];

        if(moveResult == ERR_NOT_FOUND) {
            this.creep.say('return');
            this.creep.moveTo(finalPosInPath['x'], finalPosInPath['y']);
        }
    }

    fillBalancers() {
        var roomIsFull = (this.creep.room.energyAvailable === this.creep.room.energyCapacityAvailable);

        if(roomIsFull) {
            this.creep.say('full');
            var bufferContainer = Game.getObjectById(this.creep.memory.bufferContainerId);

            if(bufferContainer != null && bufferContainer.store[RESOURCE_ENERGY] < bufferContainer.storeCapacity) {
                var inboundPath = this.creep.memory.inboundPath;

                var finalPosInPath = inboundPath[inboundPath.length-1]
                if(this.creep.pos.x === finalPosInPath.x && this.creep.pos.y === finalPosInPath.y) {
                    this.creep.transfer(bufferContainer, RESOURCE_ENERGY);
                }

                else {
                    this.moveAlongBalancerPath(inboundPath);
                }
            }
        }

        else {
            var filledExtension = this.creep.fillAdjacentFactories();

            if(!filledExtension) {
                this.traverseBalancePath(this.creep);
            }
        }
    }

    traverseBalancePath() {
        if(this.creep.memory.currentPath === undefined) {
            this.creep.memory.currentPath = 'outboundPath';
        }

        var currentPathName = this.creep.memory.currentPath;
        var currentPath = this.creep.memory[currentPathName];
        var finalPosInPath = currentPath[currentPath.length-1];

        var nextPathName = currentPathName;

        if(this.creep.pos.x === finalPosInPath.x && this.creep.pos.y === finalPosInPath.y) {
            if(currentPathName === 'outboundPath') {
                nextPathName = 'inboundPath';
            }
            else if(currentPathName === 'inboundPath') {
                nextPathName = 'outboundPath';
            }
            else {
                console.log("Error: " + this.creep.name + " has invalid path set");
            }
        }

        var nextPath = this.creep.memory[nextPathName];

        this.moveAlongBalancerPath(nextPath);

        this.creep.memory.currentPath = nextPathName;
    }

    //Init

    calculatePaths() {    
        var outboundPath = this.getBalancerPath(this.startFlag.pos, this.endFlag.pos);
        var inboundPath = this.getBalancerPath(this.endFlag.pos, this.startFlag.pos);
    
        this.creep.memory.outboundPath = outboundPath;
        this.creep.memory.inboundPath = inboundPath;
    }
    
    setEnergySource() {    
        if(this.startFlag === undefined) return;
    
        var energySources = this.startFlag.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: function(structure) { return structure.structureType == STRUCTURE_LINK || structure.structureType == STRUCTURE_STORAGE }});
    
        if(energySources.length == 0) {
            if(Game.time % 100 === 0) console.log('Cannot find energy source for ' + this.creep.name);
            return;
        }
    
        var energySource = energySources[0];
    
        this.creep.memory.energySourceId = energySource.id;
    }
    
    setBufferContainer() {
        var structuresAtFlag = this.startFlag.pos.lookFor(LOOK_STRUCTURES);
    
        if(structuresAtFlag.length == 0) {
            return;
        }
    
        var container = _.find(structuresAtFlag, function(structure) { return structure.structureType == STRUCTURE_CONTAINER; });
    
        if(container === undefined) {
            console.log('Unable to find buffer container for ' + this.creep.name);
            return;
        }
    
        this.creep.memory.bufferContainerId = container.id;
    }
    
    
    getBalancerPath(startPos, endPos, printCosts=false)
    {
        return PathFinder.search(startPos, {pos: endPos, range: 0}, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 2,
            swampCost: 3,
            
            roomCallback: function(roomName) {
                let room = Game.rooms[roomName];
                // In this example `room` will always exist, but since PathFinder 
                // supports searches which span multiple rooms you should be careful!
                if (!room)
                {
                    console.log("Can't find room " + roomName + " to generate road path");
                    return;
                }
    
                let costs = new PathFinder.CostMatrix;
    
                for(var x = 0; x < 50; x++) {
                    for(var y = 0; y < 50; y++) {
                        var posToEvaluate = new RoomPosition(x, y, roomName);
    
                        var cost = 8;
    
                        var structuresAtPos = posToEvaluate.lookFor(LOOK_STRUCTURES);
                        if(unwalkableStructuresExist(structuresAtPos)) {
                            cost = 0xff;
                        }
    
                        else {
                            var numOfAdjacentExtensions = posToEvaluate.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType: STRUCTURE_EXTENSION}}).length;
                            var numOfAdjacentSpawns = posToEvaluate.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType: STRUCTURE_SPAWN}}).length;
                            var numOfAdjacentFactories = numOfAdjacentExtensions + numOfAdjacentSpawns;
                            cost = cost/(numOfAdjacentFactories+1);
                        }
    
                        if(printCosts) new RoomVisual(roomName).text(cost, x, y);
                        costs.set(x, y, cost);
                    }
                }
    
    
                function unwalkableStructuresExist(structures) {
                    for(var i = 0; i < structures.length; i++) {
                        var structure = structures[i];
    
                        if( structure.structureType !== STRUCTURE_RAMPART && 
                            structure.structureType !== STRUCTURE_ROAD && 
                            structure.structureType !== STRUCTURE_CONTAINER) {
                               //structure is unwalkable
                            
                            return true;
                        }
                    }
    
                    return false;
                }
    
                return costs;
            }
        }).path;
    }
}

module.exports = Balancer;