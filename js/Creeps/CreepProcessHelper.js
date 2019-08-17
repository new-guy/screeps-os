exports.ensureCreepProcesses = function() {
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];

        //Check if the creep has memory.pid
        //If so, check if the process exists
        //If not, create the process

        var pid = creep.memory.pid;

        if(pid !== undefined && !Game.scheduler.processExists(pid)) {
            var creepProcessClass = creep.memory.creepProcessClass;
            var creepPriority = creep.memory.creepPriority;

            Game.scheduler.addProcess(pid, creepProcessClass, {'creepName': creep.name}, creepPriority);
        }

                // scheduler.addProcess(pid, creepProcessClass, {'creepName': creepName}, creepPriority);

                // creepMemory['spawningColonyName'] = this.name;
                // creepMemory['pid'] = 'creep|' + creepName;
                // creepMemory['creepProcessClass'] = creepProcessClass;
                // creepMemory['creepPriority'] = creepPriority;
    }
}