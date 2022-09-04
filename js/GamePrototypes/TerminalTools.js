StructureTerminal.prototype.getResourceTargets = function() {
    if(this.resourceTargets == null) {
        var resourceTargets = {};
        var room = this.room;
    
        RESOURCES_ALL.forEach(function(item, index) {
            var target = DEFAULT_RESOURCE_TERMINAL_TARGET;
            if(item == room.mineral.mineralType) {
                target = ROOM_OWN_MINERAL_TERMINAL_TARGET;
            }
            else if(GLOBAL_TERMINAL_RESOURCE_TARGET_OVERRIDES[item] != null) {
                target = GLOBAL_TERMINAL_RESOURCE_TARGET_OVERRIDES[item]
            }
            resourceTargets[item] = target;
        })

        this.resourceTargets = resourceTargets;
    }

    return this.resourceTargets;
}