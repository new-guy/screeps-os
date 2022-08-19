const CreepProcess = require('CreepProcess');

class Balancer extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep != null) {
            this.targetRoom = Game.rooms[this.creep.memory['targetRoom']];
            this.startFlag = Game.flags[this.creep.memory['startFlagName']];
            this.endFlag = Game.flags[this.creep.memory['endFlagName']];
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        if(this.isTooSmall()) {
            this.creep.suicide();
            return;
        }

        if(this.creep.memory.hasInitialized !== true) {
            this.calculatePaths();
            this.setEnergySource();

            this.creep.memory.hasInitialized = true;
        }
    }

    isTooSmall() {
        var roomHasStorage = this.creep.room.storage != null;
        var roomIsFull = this.creep.room.energyAvailable === this.creep.room.energyCapacityAvailable;
        var creepIsSmall = this.creep.body.length <= SMALL_BALANCER_CARRY_PARTS*(1.5);

        return roomHasStorage && roomIsFull && creepIsSmall;
    }

    updateStateTransitions() {
        if(this.creep.memory.state == null)
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
            if(this.creep.isEmpty() || (!this.creep.isFull() && this.creep.room.energyAvailable === this.creep.room.energyCapacityAvailable))
            {
                this.creep.clearTarget();
                
                this.creep.memory.state = "pickup";
            }
        }
    }

    performStateActions() {
        if(this.creep.room.name !== this.targetRoom.name) {
            this.creep.say('🚌');
            this.creep.moveTo(new RoomPosition(25, 25, this.targetRoom.name));
            return;
        }

        if(this.creep.memory.state == null)
        {
            this.creep.memory.state = "pickup";
        }
    
        if(this.creep.memory.state === "pickup")
        {
            this.creep.say('🚶');
            this.pickupEnergy();
        }

        if(this.creep.memory.state === "fill")
        {
            this.creep.say('⚡');
            var roomIsFull = (this.creep.room.energyAvailable === this.creep.room.energyCapacityAvailable);
            if(roomIsFull) {
                var energySource = Game.getObjectById(this.creep.memory.energySourceId);
                if(energySource != null && energySource.structureType === STRUCTURE_STORAGE) {
                    //Only do this for the balancer that uses storage as its energySource
                    //Ensure link is full if it exists
                    var linksNearStorage = energySource.pos.findInRange(FIND_MY_STRUCTURES, 2, {filter: function(structure) { 
                        return structure.structureType == STRUCTURE_LINK}});

                    if(linksNearStorage.length > 0) {
                        var sourceLink = linksNearStorage[0];
                        this.ensureLinkIsFull(sourceLink)
                    }
                }
            }
            else {
                this.fillBalancers();
            }
        }
    }

    ensureLinkIsFull(sourceLink) {
        if(sourceLink.store[RESOURCE_ENERGY] < sourceLink.store.getCapacity(RESOURCE_ENERGY)) {
            if(this.creep.pos.isNearTo(sourceLink)) {
                this.creep.transfer(sourceLink, RESOURCE_ENERGY)
            }
            else {
                this.creep.moveTo(sourceLink);
            }
        }
    }

    pickupEnergy() {
        var energySource = Game.getObjectById(this.creep.memory.energySourceId);
        var inboundPath = this.creep.memory.inboundPath;

        var finalPosInPath = inboundPath[inboundPath.length-1]

        if(energySource == null || energySource.store[RESOURCE_ENERGY] === 0) {
            this.setEnergySource();
            energySource = Game.getObjectById(this.creep.memory.energySourceId);

            if(energySource == null || energySource.store[RESOURCE_ENERGY] === 0) {
                this.creep.getEnergyFromHarvestDestination(this.creep.room);

                return;
            }
        }

        if(this.creep.pos.x === finalPosInPath.x && this.creep.pos.y === finalPosInPath.y) {
            var sourceToWithdrawFrom = energySource;

            this.creep.withdraw(sourceToWithdrawFrom, RESOURCE_ENERGY);
        }

        else {
            this.moveAlongBalancerPath(inboundPath);
        }
    }

    moveAlongBalancerPath(path) {
        var currentPos = this.creep.pos;
        var lastPos = this.creep.memory.lastPosition;

        if(lastPos != null && lastPos.x === currentPos.x && lastPos.y === currentPos.y) {
            //Find adjacent creeps and make them move randomly
            this.creep.pos.randomMoveAdjacentCreeps();
        }

        this.creep.memory.lastPosition = {
            "x": currentPos.x,
            "y": currentPos.y
        };

        var roomPosPath = [];

        for(var i = 0; i < path.length; i++) {
            var pos = new RoomPosition(path[i].x, path[i].y, path[i].roomName);

            roomPosPath.push(pos);
        }

        var moveResult = this.creep.moveByPath(roomPosPath);
        var finalPosInPath = path[path.length-1];

        if(moveResult == ERR_NOT_FOUND) {
            this.creep.say('🚶');
            this.creep.moveTo(finalPosInPath['x'], finalPosInPath['y']);
        }
    }

    fillBalancers() {
        var roomIsFull = this.creep.room.energyAvailable === this.creep.room.energyCapacityAvailable;
        if(roomIsFull) {
            this.creep.say('🌝');
        }

        else {
            var filledExtension = this.creep.fillAdjacentFactories();

            if(!filledExtension) {
                this.traverseBalancePath(this.creep);
            }
        }
    }

    traverseBalancePath() {
        if(this.creep.memory.currentPath == null) {
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
        if(this.startFlag == null) return;
    
        var energySources = this.startFlag.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: function(structure) { 
            return (structure.structureType == STRUCTURE_LINK && structure.energy > 0) || (structure.structureType == STRUCTURE_STORAGE && structure.store.energy > 0) }});
    
        if(energySources.length == 0) {
            if(Game.time % 100 === 0) console.log('Cannot find energy source for ' + this.creep.name);

            return;
        }
    
        var energySource = energySources[0];
    
        this.creep.memory.energySourceId = energySource.id;
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