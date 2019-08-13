const Process = require('Process');

class ColonyScoutingManager extends Process {
    constructor (...args) {
        super(...args);

        this.colony = Game.colonies[this.memory.colonyName];
    }

    update() {
        console.log('Scouting Manager ' + this.pid + ' Colony: ' + this.memory.colonyName);

        if(super.update() == 'exit') {
            return 'exit';
        }

        var roomsByDistance = _.groupBy(this.colony.colonyRoomInfo, function(roomInfo) {
            return roomInfo.travelDistance.toString();
        });

        for(var distance in roomsByDistance) {
            console.log(distance)

            for(var i in roomsByDistance[distance]) {
                var roomName = roomsByDistance[distance][i].roomName;

                console.log('Checking if we should scout ' + roomName);

                //For each roomName in our list of colonyRoom
                    //Do we have vision on it?
                        //Update our info on it & update [SCOUTING_INFO].colonyScouted
                    //Need to check if the scouting info exists
                        //If not, send scout
                        //If so, and the last time we [SCOUTING_INFO].colonyScouted is past MAX_SCOUT_INTERVAL
                            //send scout
            }
        }

    }

    processShouldDie() {
        return this.colony === undefined;
    }
}

module.exports = ColonyScoutingManager;