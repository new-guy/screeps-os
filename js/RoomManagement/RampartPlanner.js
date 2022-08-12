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
    
        if(this.room === undefined || this.room.memory.buildingPlan == undefined) {
            return 'continue';
        }

        if(this.room.storage !== undefined && this.room.constructionSites.length === 0) {
            this.ensureRamparts();
        }

        this.drawRamparts();
    }

    ensureRamparts() {
        for(var x = 0; x < this.room.memory.buildingPlan.length; x++) {
            var column = this.room.memory.buildingPlan[x];

            for(var y = 0; y < column.length; y++) {
                var structureType = column[y];
                if(structureType === 'none') continue;
                else {
                    var pos = new RoomPosition(x, y, this.room.name);
                    if (pos.structureExists(STRUCTURE_RAMPART)) {
                        continue;
                    }
                    else {
                        pos.createConstructionSite(STRUCTURE_RAMPART);
                        break;
                    }
                }
            }
        }
    }

    drawRamparts() {
        for(var x = 0; x < this.room.memory.buildingPlan.length; x++) {
            var column = this.room.memory.buildingPlan[x];

            for(var y = 0; y < column.length; y++) {
                var structureType = column[y];
                if(structureType === 'none') continue;
                else {
                    var pos = new RoomPosition(x, y, this.room.name);
                    if (pos.structureExists(STRUCTURE_RAMPART)) {
                        continue;
                    }
                    else {
                        new RoomVisual(this.room.name).circle(x, y, {opacity: 0.3, radius: 0.3, fill: '#ffaaaa'});
                    }
                }
            }
        }
    }
}

module.exports = RampartPlanner;