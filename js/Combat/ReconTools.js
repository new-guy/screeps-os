class ReconTools {
    constructor () {
        if(Memory.recon === undefined) {
            Memory.recon = {};
        }
    }

    update() {
    }

    initRoomRecon(room) {
        if(room.memory.recon === undefined) {
            room.memory.recon = {};
        }

        var isRoomDangerous = this.isRoomDangerous(room);
        this.recordRoomDanger(room.name, isRoomDangerous);
    }

    isRoomDangerous(room) {
        var isDangerous = room.enemies !== undefined;
        return isDangerous;
    }

    recordRoomDanger(roomName, isDangerous) {
        Memory.rooms[roomName].recon.isDangerous = isDangerous;

        if(isDangerous) {
            Memory.rooms[roomName].recon.dangerLastSeen = Game.time
        }
    }

    updateInvaderStatus(roomName) {
        var hasInvader = _.filter(Game.room[roomName].enemies, function(r) { 
            return r.owner.username === 'Invader' }).length > 0;
    }

    isRoomNameDangerous(roomName) {
        var room = Game.rooms[roomName];
        if(room === undefined) {
            if(Memory.rooms[roomName] === undefined) return false;
            var isDangerous = Memory.rooms[roomName].recon.isDangerous;
            if(isDangerous === undefined || !isDangerous) {
                return false;
            }

            else {
                return (Game.time - Memory.rooms[roomName].recon.dangerLastSeen) >= ROOM_IS_DANGEROUS_TIMEOUT;
            }
        }

        else {
            return this.isRoomDangerous(room);
        }
    }
}

module.exports = ReconTools;