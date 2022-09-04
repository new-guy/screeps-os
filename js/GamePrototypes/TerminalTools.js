StructureTerminal.prototype.getResourceTargets = function() {
    var resourceTargets = {};

    RESOURCES_ALL.forEach(function(item, index) {
        var target = DEFAULT_RESOURCE_TERMINAL_TARGET;
        if(item == this.room.mineral.mineralType) {
            target = ROOM_OWN_MINERAL_TERMINAL_TARGET;
        }
        else if(GLOBAL_TERMINAL_RESOURCE_TARGET_OVERRIDES[item] != null) {
            target = GLOBAL_TERMINAL_RESOURCE_TARGET_OVERRIDES[item]
        }
        resourceTargets[item] = target;
    })

    return resourceTargets;
}