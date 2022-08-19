const Process = require('Process');

class LinkManager extends Process {
    constructor (...args) {
        super(...args);

        this.room = Game.rooms[this.memory.roomName];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    
        if(this.room == null) {
            return 'continue';
        }

        var sourceLinks = this.room.getSourceLinks();
        var sinkLinks = this.room.getSinkLinks();
        //If we're pre-storage, bootstrap

        for(var i = 0; i < sourceLinks.length; i++) {
            var sourceLink = sourceLinks[i];
            if(sourceLink.store[RESOURCE_ENERGY] === 0) continue;

            for(var j = 0; j < sinkLinks.length; j++) {
                var sinkLink = sinkLinks[j];
                if(sinkLink.store[RESOURCE_ENERGY] < sinkLink.store.getCapacity(RESOURCE_ENERGY)) {
                    sourceLink.transferEnergy(sinkLink);
                    sinkLinks.splice(j, 1);
                    j--;
                }
            }
        }
    }
}

module.exports = LinkManager;