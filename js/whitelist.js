exports.list = whitelist;

var whitelist = [
    Game.spawns['Spawn1'].owner.username
];

Memory.whitelist = whitelist;

Creep.prototype.isHostile = function() {
    return !this.isFriendly();
}

Creep.prototype.isFriendly = function() {
    return whitelist.includes(this.owner.username);
}