const Process = require('Process');

class EmpireManager extends Process {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        for(var roomName in Game.colonies) {
            console.log('Colony ' + roomName);

            var pid = 'colman|' + roomName;
            this.scheduler.ensureProcessExists(pid, 'ColonyManager', {'primaryRoom': roomName}, COLONY_MANAGEMENT_PRIORITY);
        }

        for(var roomName in Game.rooms) {
            var room = Game.rooms[roomName];
    
            if(room.memory.buildingPlan !== undefined) {
                this.ensureChildProcess(roomName + '|constructionSiteManager', 'RoomConstructionSiteManager', {'roomName': roomName}, COLONY_NONESSENTIAL_PRIORITY);
            }
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = EmpireManager;