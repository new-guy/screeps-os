const CreepProcess = require('CreepProcess');

class Miner extends CreepProcess {
    constructor (...args) {
        super(...args);

        if(this.creep !== undefined) {
            this.targetSource = Game.getObjectById(this.creep.memory['targetSourceId']);
            this.containerPos = new RoomPosition(this.creep.memory['containerPos']['x'], this.creep.memory['containerPos']['y'], this.creep.memory['containerPos']['roomName'])

            if(Game.rooms[this.containerPos.roomName] !== undefined) {
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
        if(this.targetSource === undefined) {
            this.creep.moveTo(containerPos);
        }

        else if(this.creep.pos.getRangeTo(this.containerPos) > 0) {
            this.creep.moveTo(this.containerPos);
            this.creep.say('Move')
        }

        else {
            if(this.creep.carry.energy < this.creep.carryCapacity) {
                this.creep.harvest(this.targetSource);
                this.creep.say('Harvest');
            }

            else {
                if(this.container === null) {
                    var containerConstructionSite = this.containerPos.getConstructionSite(STRUCTURE_CONTAINER);
                    if(containerConstructionSite === null) {
                        this.containerPos.createConstructionSite(STRUCTURE_CONTAINER);
                        this.creep.say('Create');
                    }

                    else {
                        this.creep.say(this.creep.build(containerConstructionSite));
                        this.creep.say('Build');
                    }
                }

                else {
                    if(this.container.hits < this.container.hitsMax) {
                        this.creep.repair(this.container);
                        this.creep.say('Rep');
                    } 

                    else {
                        this.creep.drop(RESOURCE_ENERGY);
                        this.creep.say('Drop');
                    }
                }
            }
        }
    }
}

module.exports = Miner;