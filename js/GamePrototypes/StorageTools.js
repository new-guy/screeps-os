StructureStorage.prototype.getResourceTargets = function() {
    if(this.resourceTargets == null) {
        var resourceTargets = {};
        var room = this.room;
    
        RESOURCES_ALL.forEach(function(item, index) {
            var target = DEFAULT_RESOURCE_STORAGE_TARGET;
            if(item == room.mineral.mineralType) {
                target = ROOM_OWN_MINERAL_STORAGE_TARGET;
            }
            else if(GLOBAL_STORAGE_RESOURCE_TARGET_OVERRIDES[item] != null) {
                target = GLOBAL_STORAGE_RESOURCE_TARGET_OVERRIDES[item]
            }
            resourceTargets[item] = target;
        });

        this.resourceTargets = resourceTargets;
    }

    return this.resourceTargets;
}