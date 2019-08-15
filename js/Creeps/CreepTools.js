var MIN_DIST_FROM_SK = 5;

Creep.prototype.getSafePath = function(targetPosition, range=0) {
    let goals = {pos: targetPosition, range: range};

    let ret = PathFinder.search(this.pos, goals,
        {
          // We need to set the defaults costs higher so that we
          // can set the road cost lower in `roomCallback`
          plainCost: 2,
          swampCost: 5,
    
          roomCallback: function(roomName) {
            let room = Game.rooms[roomName];
            if (!room) return;
            let costs = new PathFinder.CostMatrix;
    
            // Avoid creeps in the room
            var enemyCreeps = room.find(FIND_CREEPS, {filter: function(creep){
                return creep.isHostile();
            }});

            if(enemyCreeps.length > 0) {
                for(var x = 0; x < 49; x++) {
                    for(var y = 0; y < 49; y++) {
                        var position = new RoomPosition(x, y, roomName);
                        
                        var nearestEnemy = position.findClosestByRange(enemyCreeps);

                        if(position.getRangeTo(nearestEnemy) <= MIN_DIST_FROM_SK) {
                            costs.set(x, y, 0xff);
                        }
                    }
                }
            }
    
            return costs;
          },
        }
    );

    return ret.path;
}

Creep.prototype.curse = function() {
    this.sayInOrder(['Fuck', 'Shit!', 'Dang', 'Dag', 'Wtf?', 'Wut']);
}

Creep.prototype.sayInOrder = function(words) {
    if(this.memory.talkStart === undefined) {
        this.memory.talkStart = Game.time;
    }

    var index = (Game.time + this.memory.talkStart) % words.length;

    this.say(words[index]);
}
