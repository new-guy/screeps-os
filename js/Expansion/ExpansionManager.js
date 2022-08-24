const Process = require('Process');

class ExpansionManager extends Process {
    constructor (...args) {
        super(...args);

        this.targetRoom = Game.rooms[this.memory.targetRoom];
        this.spawnColony = Game.colonies[this.memory.spawnColony];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
        
        var roomHasBeenClaimed = this.targetRoom != null && this.targetRoom.controller.my;
        if(!roomHasBeenClaimed) {
            this.ensureClaimer();
            console.log('Ensuring Claimer ' + this.memory.targetRoom)
        }

        else {
            if(Game.colonies[this.targetRoom.name] == null) {
                Memory.colonies[this.targetRoom.name] = {
                    'name': this.targetRoom.name,
                    'primaryRoomName': this.targetRoom.name
                }
            }
            else {
                this.ensureHeart();
                this.ensureSpawn();
                this.ensureExpansionBootstrap();
                this.drawOnMap();
            }

            if(this.targetRoom.storage != null) {
                var expansionFlag = Game.flags['!EXPAND|'+this.spawnColony.name];
                expansionFlag.remove();
            }
        }
    }

    drawOnMap() {
        var sourceColonyPos = new RoomPosition(25, 25, this.spawnColony.primaryRoom.name);
        var expansionTargetPos = new RoomPosition(25, 25, this.targetRoom.name);
        Game.map.visual.circle(sourceColonyPos, {fill: '#9999ff', radius: 8, opacity: 0.5, stroke: "#999999", strokeWidth: 0.8});
        Game.map.visual.line(sourceColonyPos, expansionTargetPos, {color: '#9999ff', opacity: 0.8, width: 0.8, lineStyle: 'dotted'});
    }

    ensureClaimer() {
        var data = {
            'colonyName': this.spawnColony.name,
            'creepCount': 1,
            'creepNameBase': 'expandClaimer|' + this.memory.targetRoom,
            'creepBodyType': 'Claimer',
            'creepProcessClass': 'Claimer',
            'creepMemory': {
                'targetRoom': this.memory.targetRoom
            }
        };
        
        var spawnPID = 'spawnExpansionClaimer|' + this.spawnColony.name + '|' + this.memory.targetRoom;
        this.ensureChildProcess(spawnPID, 'SpawnCreep', data, COLONY_MANAGEMENT_PRIORITY);
    }

    ensureHeart() {
        if(!this.targetRoom.hasHeart()) {
            if(this.targetRoom.canPlaceHeart()) {
                this.targetRoom.placeHeart();
            }
            else {
                var expansionFlag = Game.flags['!EXPAND|'+this.spawnColony.name];
                expansionFlag.setColor(COLOR_RED);
            }
        }
    }

    ensureSpawn() {
        if(this.targetRoom.constructionSites.length === 0 && this.targetRoom.spawns.length === 0 && Game.time % 10 === 0) {
            this.targetRoom.forceBuildingRegeneration();
        }
    }

    ensureExpansionBootstrap() {
        var expansionBootstrapPID = 'expBoot|' + this.spawnColony.name + '|' + this.targetRoom.name
        this.ensureChildProcess(expansionBootstrapPID, 'ExpansionBootstrap', {'spawnColonyName': this.spawnColony.name, 'targetRoomName': this.targetRoom.name}, COLONY_EXPANSION_SUPPORT);
    }
}

module.exports = ExpansionManager;