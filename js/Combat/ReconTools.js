class ReconTools {
    constructor () {
        if(Memory.recon == null) {
            Memory.recon = {};
        }
    }

    update() {
    }

    initRoomRecon(room) {
        if(room.memory.recon == null) {
            room.memory.recon = {};
        }

        var isRoomDangerous = this.isRoomDangerous(room);

        this.recordRoomDanger(room.name, isRoomDangerous);
    }

    isRoomDangerous(room) {
        var isDangerous = room.enemies != null;
        return isDangerous;
    }

    recordRoomDanger(roomName, isDangerous) {
        Memory.rooms[roomName].recon.isDangerous = isDangerous;

        if(isDangerous) {
            Memory.rooms[roomName].recon.dangerLastSeen = Game.time
        }
    }

    isRoomNameDangerous(roomName) {
        var room = Game.rooms[roomName];
        if(room == null) {
            if(Memory.rooms[roomName] == null) return false;
            if(Memory.rooms[roomName].recon == null) {
                Memory.rooms[roomName].recon = {};
            }

            var isDangerous = Memory.rooms[roomName].recon.isDangerous;
            if(isDangerous == null || !isDangerous) {
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