const Process = require('Process');

class RampartPlanner extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    
        if(this.room == null || this.room.memory.buildingPlan == undefined) {
            return 'continue';
        }

        this.ensureRamparts();
    }

    ensureRamparts() {
        var rampartShouldBeCreated = (this.room.constructionSites.length === 0 && this.room.storage != null);

        for(var x = 0; x < this.room.memory.buildingPlan.length; x++) {
            var column = this.room.memory.buildingPlan[x];

            for(var y = 0; y < column.length; y++) {
                var structureType = column[y];
                if(structureType === 'none') continue;
                else {
                    var pos = new RoomPosition(x, y, this.room.name);
                    rampartShouldBeCreated = this.ensureRampartForPos(pos, rampartShouldBeCreated);
                }
            }
        }

        rampartShouldBeCreated = this.ensureControllerRamparts(rampartShouldBeCreated);
    }

    ensureRampartForPos(pos, rampartShouldBeCreated) {
        if (pos.structureExists(STRUCTURE_RAMPART)) {
            return true;
        }
        else {
            if(rampartShouldBeCreated) {
                pos.createConstructionSite(STRUCTURE_RAMPART);
            }
            else {
                new RoomVisual(this.room.name).circle(pos, {opacity: 0.3, radius: 0.3, fill: '#ffaaaa'});
            }
            return false;
        }
    }

    ensureControllerRamparts(rampartShouldBeCreated) {
        var controller = this.room.controller;
        var walkableControllerTiles = controller.pos.getAdjacentWalkablePositions();

        for(var i = 0; i < walkableControllerTiles.length; i++) {
            var walkablePos = walkableControllerTiles[i];
            rampartShouldBeCreated = this.ensureRampartForPos(walkablePos, rampartShouldBeCreated);
        }

        return rampartShouldBeCreated;
    }
}

module.exports = RampartPlanner;