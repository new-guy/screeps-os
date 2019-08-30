const Process = require('Process');

var SLEEP_TIMING = 1;

class LinkFlagParser extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }

        this.parseLinkFlags();
        this.sleep(SLEEP_TIMING)
    }

    processShouldDie() {
        return false;
    }

    parseLinkFlags()
    {
        var linkFlags = this.room.find(FIND_FLAGS, {filter: function(flag) { 
            return flag.name.startsWith("!LINKSOURCE") || flag.name.startsWith("!LINKSINK") }});
    
        for(var i = 0; i < linkFlags.length; i++) {
            var addResult = this.addLinkToMemory(linkFlags[i]);
            //Add the flag to memory
            //If that succeeds, delete the flag, else complain
            if(addResult == true) linkFlags[i].remove();
        }
    }

    addLinkToMemory(linkFlag) {
        var flagRoom = Game.rooms[linkFlag.pos.roomName];
        if(flagRoom === undefined) {
            console.log("Error: cannot write " + linkFlag.name + ' to memory.  Cannot access room ' + linkFlag.pos.roomName);
            return false;
        }
    
        var linkAtPos = _.find(linkFlag.pos.lookFor(LOOK_STRUCTURES), {'structureType': STRUCTURE_LINK});
    
        if(linkAtPos === undefined) {
            if(Game.time % 50 === 0) console.log("Error: cannot write " + linkFlag.name + ' to memory.  Cannot find link at pos');
            return false;
        }
    
        if(flagRoom.memory.links === undefined) {
            flagRoom.memory.links = {"sourceIds": {}, "sinkIds": {}};
        }
    
        if(linkFlag.name.startsWith("!LINKSOURCE")) {
            if(flagRoom.memory.links['sourceIds'] === undefined)
                flagRoom.memory.links['sourceIds'] = {};
    
            flagRoom.memory.links['sourceIds'][linkAtPos.id] = true;
            console.log('Added ' + linkFlag.name + ' to memory');
        }
    
        else if(linkFlag.name.startsWith("!LINKSINK")) {
            if(flagRoom.memory.links['sinkIds'] === undefined)
                flagRoom.memory.links['sinkIds'] = {};
            flagRoom.memory.links['sinkIds'][linkAtPos.id] = true;
            console.log('Added ' + linkFlag.name + ' to memory');
        }
    
        else {
            console.log("Error: cannot write " + linkFlag.name + ' to memory.  Invalid Flag Name');
            return false;
        }
    
        return true;
    }
}

module.exports = LinkFlagParser;

