const Process = require('Process');

class SecondaryRoomFinder extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        var hasCheckedAll = true;
        for(var roomName in this.colony.memory.colonyRoomInfo) {
            if(roomName === this.colony.primaryRoom.name) continue;

            var colonyRoomInfo = this.colony.memory.colonyRoomInfo[roomName];

            if(colonyRoomInfo['checkedForSecondary'] === true) {
                continue;
            }

            else {
                hasCheckedAll = false;
            }

            if(colonyRoomInfo['distanceFromPrimary'] > 2) {
                continue;
            }


            var room = Game.rooms[roomName];

            if(room === undefined) {
                continue;
            }

            else {
                console.log('Check Secondary: ' + roomName);
                if(room.hasSourceKeepers) {
                    colonyRoomInfo['isValidSeconary'] = false;
                    colonyRoomInfo['checkedForSecondary'] = true;
                }
                else {
                    var isValidCandidate = this.tryToPlaceHeart(room);
    
                    colonyRoomInfo['isValidSeconary'] = isValidCandidate;
                    colonyRoomInfo['checkedForSecondary'] = true;
                    colonyRoomInfo['plainsPercentage'] = room.getPlainsPercentage();
                }
            }

            break;
        }
    }

    tryToPlaceHeart(room) {
        var middleOfRoom = new RoomPosition(24, 24, room.name);
        var flagPosition = room.findRootForChunk('heart', middleOfRoom, 15);

        if(flagPosition == null) {
            return false;
        }
        else {
            return true;
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = SecondaryRoomFinder;