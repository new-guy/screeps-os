const CreepProcess = require('CreepProcess');

class Miner extends CreepProcess {
    constructor (...args) {
        super(...args);
        this.creepEmoji = '⚡'

        if(this.creep != null) {
            if(this.creep.memory.targetSourcePos != null) {
                this.targetResourcePos = new RoomPosition(this.creep.memory.targetSourcePos.x, this.creep.memory.targetSourcePos.y, this.creep.memory.targetSourcePos.roomName);
                this.mode = 'energy';

                if(Game.rooms[this.targetResourcePos.roomName] != null) {
                    this.targetResource = this.targetResourcePos.lookFor(LOOK_SOURCES)[0];
                }
            }
            if(this.creep.memory.targetMineralPos != null) {
                this.targetResourcePos = new RoomPosition(this.creep.memory.targetMineralPos.x, this.creep.memory.targetMineralPos.y, this.creep.memory.targetMineralPos.roomName);
                this.mode = 'mineral';

                if(Game.rooms[this.targetResourcePos.roomName] != null) {
                    this.targetResource = this.targetResourcePos.lookFor(LOOK_MINERALS)[0];
                }
            }

            this.containerPos = new RoomPosition(this.creep.memory['containerPos']['x'], this.creep.memory['containerPos']['y'], this.creep.memory['containerPos']['roomName'])

            if(Game.rooms[this.containerPos.roomName] != null) {
                this.container = this.containerPos.getStructure(STRUCTURE_CONTAINER);
            }
        }
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    performStateActions() {
        if(this.targetResource == null) {
            this.creep.moveTo(this.targetResourcePos);
        }

        else if(this.creep.pos.getRangeTo(this.containerPos) > 0) {
            this.creep.moveTo(this.containerPos);
            this.creep.say('🚶')
        }

        else {
            if(this.mode === 'energy') {
                this.harvestEnergy();
            }
            else if(this.mode === 'mineral') {
                this.harvestMineral();
            }
        }
    }

    harvestEnergy() {
        if((this.container == null && this.creep.carry.energy < this.creep.carryCapacity/2) ||
           (this.container != null && this.creep.carry.energy < this.creep.carryCapacity)) {
            this.creep.harvest(this.targetResource);
            this.creep.say('⚡');
        }

        else {
            if(this.container == null) {
                var containerConstructionSite = this.containerPos.getConstructionSite(STRUCTURE_CONTAINER);
                if(containerConstructionSite == null) {
                    this.containerPos.createConstructionSite(STRUCTURE_CONTAINER);
                    this.creep.say('Create');
                }

                else {
                    this.creep.say(this.creep.build(containerConstructionSite));
                    this.creep.say('🔨');
                }
            }

            else {
                if(this.container.hits < this.container.hitsMax) {
                    this.creep.repair(this.container);
                    this.creep.say('🔧');
                } 

                else {
                    this.creep.drop(RESOURCE_ENERGY);
                    this.creep.say('💰');
                }
            }
        }
    }

    harvestMineral() {
        if(this.creep.store.getFreeCapacity() === 0) {
            this.creep.drop(this.creep.memory.mineralType);
        }
        else {
            this.creep.harvest(this.targetResource);
            this.creep.say('⚡');
        }
    }
}

module.exports = Miner;