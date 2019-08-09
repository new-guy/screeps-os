//Load non-process info
//Initialize the scheduler.  Load PID metadata from memory & sort it
//Run main scheduler loop
const Scheduler = require('Scheduler');

module.exports.loop = function() {
    const scheduler = new Scheduler();
    scheduler.update();
}