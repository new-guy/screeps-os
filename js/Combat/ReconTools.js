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

        this.recordRoomDanger(room, isRoomDangerous);
    }

    isRoomDangerous(room) {
        var isDangerous = room.enemies !== undefined;
        return isDangerous;
    }

    recordRoomDanger(room, isDangerous) {
        room.memory.recon.isDangerous = isDangerous;

        if(isDangerous) {
            room.memory.recon.dangerLastSeen = Game.time
        }
    }

    isRoomNameDangerous(roomName) {
        var room = Game.rooms[roomName];
        if(room === undefined) {
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