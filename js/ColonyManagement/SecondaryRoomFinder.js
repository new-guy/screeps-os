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
        //Loop for finding info about each candidate
        for(var roomName in this.colony.memory.colonyRoomInfo) {
            var colonyRoomInfo = this.colony.memory.colonyRoomInfo[roomName];

            if(roomName === this.colony.primaryRoom.name) {
                colonyRoomInfo['checkedForSecondary'] = true;
                colonyRoomInfo['isValidSecondary'] = false;
                continue;
            }

            if(colonyRoomInfo['stepsToPrimary'] > SECONDARY_MAX_STEPS_TO_PRIMARY) {
                continue;
            }

            if(colonyRoomInfo['checkedForSecondary'] === true) {
                continue;
            }

            else {
                hasCheckedAll = false;
            }


            var room = Game.rooms[roomName];

            if(room == null) {
                continue;
            }

            else {
                console.log('Check Secondary: ' + roomName);
                if(room.controller == null) {
                    colonyRoomInfo['isValidSecondary'] = false;
                    colonyRoomInfo['checkedForSecondary'] = true;
                }
                else if(room.hasSourceKeepers) {
                    colonyRoomInfo['isValidSecondary'] = false;
                    colonyRoomInfo['checkedForSecondary'] = true;
                }
                else {
                    var isValidCandidate = room.canPlaceHeart();
    
                    colonyRoomInfo['isValidSecondary'] = isValidCandidate;
                    colonyRoomInfo['checkedForSecondary'] = true;
                    colonyRoomInfo['plainsPercentage'] = room.getPlainsPercentage();
                }
            }

            break;
        }

        if(hasCheckedAll) {
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

            if(currentCandidate != null) {
                var candidateRoom = Game.rooms[currentCandidate];

                if(candidateRoom != null) {
                    if(candidateRoom.placeHeart()) {
                        this.colony.memory['secondaryRoomName'] = currentCandidate;
                    }
                }
            }
        }
    }

    processShouldDie() {
        return false;
    }
}

module.exports = SecondaryRoomFinder;