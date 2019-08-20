const Process = require('Process');

var HEART_MAX_DISTANCE = 15;
var MAX_STEPS_TO_PRIMARY = 1;

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
        //Loop for finding info about each candidate
        for(var roomName in this.colony.memory.colonyRoomInfo) {
            var colonyRoomInfo = this.colony.memory.colonyRoomInfo[roomName];

            if(roomName === this.colony.primaryRoom.name) {
                colonyRoomInfo['checkedForSecondary'] = true;
                colonyRoomInfo['isValidSecondary'] = false;
                continue;
            }

            if(colonyRoomInfo['stepsToPrimary'] > MAX_STEPS_TO_PRIMARY) {
                continue;
            }

            if(colonyRoomInfo['checkedForSecondary'] === true) {
                continue;
            }

            else {
                hasCheckedAll = false;
            }


            var room = Game.rooms[roomName];

            console.log(roomName);

            if(room === undefined) {
                continue;
            }

            else {
                console.log('Check Secondary: ' + roomName);
                if(room.hasSourceKeepers) {
                    colonyRoomInfo['isValidSecondary'] = false;
                    colonyRoomInfo['checkedForSecondary'] = true;
                }
                else {
                    var isValidCandidate = this.tryToPlaceHeart(room);
    
                    colonyRoomInfo['isValidSecondary'] = isValidCandidate;
                    colonyRoomInfo['checkedForSecondary'] = true;
                    colonyRoomInfo['plainsPercentage'] = room.getPlainsPercentage();
                }
            }

            break;
        }

        if(hasCheckedAll) {
            console.log('hca');
            //Loop for selecting secondary room
            var currentCandidate = null;
            var currentPlainsPercent = 0.0;

            for(var roomName in this.colony.memory.colonyRoomInfo) {
                var colonyRoomInfo = this.colony.memory.colonyRoomInfo[roomName];

                if(!colonyRoomInfo['isValidSecondary']) continue;

                if(colonyRoomInfo['plainsPercentage'] > currentPlainsPercent) {
                    currentCandidate = roomName;
                    currentPlainsPercent = colonyRoomInfo['plainsPercentage'];
                }
            }

            if(currentCandidate !== null) {
                console.log('Would set candidate ' + currentCandidate + ' ' + currentPlainsPercent);
                var candidateRoom = Game.rooms[currentCandidate];

                if(candidateRoom !== undefined) {
                    if(this.placeHeart(candidateRoom)) {
                        this.colony.memory['secondaryRoomName'] = currentCandidate;
                    }
                }
            }
        }
    }

    tryToPlaceHeart(room) {
        var middleOfRoom = new RoomPosition(24, 24, room.name);
        var flagPosition = room.findRootForChunk('heart', middleOfRoom, HEART_MAX_DISTANCE);

        if(flagPosition == null) {
            return false;
        }
        else {
            return true;
        }
    }

    placeHeart(room) {
        var middleOfRoom = new RoomPosition(24, 24, room.name);
        var flagPosition = Game.rooms[room.name].findRootForChunk('heart', middleOfRoom, HEART_MAX_DISTANCE);
        
        console.log(flagPosition.x + 'x ' + flagPosition.y + 'y ' + flagPosition.roomName);

        if(flagPosition == null) {
            console.log('CANNOT FIND PLACE FOR INTIAL HEART');
            return false;
        }
        else {
            flagPosition.createFlag('!CHUNK|heart|' + flagPosition.roomName, COLOR_RED);
            return true;
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = SecondaryRoomFinder;