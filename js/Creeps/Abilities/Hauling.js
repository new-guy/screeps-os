Creep.prototype.haulResourceFromSourceToSink = function(resourceType, source, sink, opts={amount: undefined, haulUntilEmpty: false}) {
    //Opts:
    var amount = opts.amount;
    //haulUntilEmpty
    var haulUntilEmpty = opts.haulUntilEmpty;

    var shouldGetResource = haulUntilEmpty === true ? this.store[resourceType] == 0 : this.store[resourceType] < this.store.getCapacity(resourceType);

    if(shouldGetResource) {
        if(this.pos.getRangeTo(source) > 1) {
            this.moveTo(source);
        }
        else {
            if(amount == null) amount == this.store.getFreeCapacity(resourceType);
            else amount = Math.min(this.store.getFreeCapacity(resourceType), amount);

            this.withdraw(source, resourceType, amount);
        }
    }
    else {
        if(this.pos.getRangeTo(sink) > 1) {
            this.moveTo(sink);
        }
        else {
            if(amount == null) amount == this.store.getUsedCapacity(resourceType);
            else amount = Math.min(this.store.getUsedCapacity(resourceType), amount);

            this.transfer(sink, resourceType, amount);
        }
    }
}