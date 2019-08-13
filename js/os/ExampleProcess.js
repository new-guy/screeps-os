const Process = require('Process');

class ExampleProcess extends Process {
    constructor (...args) {
        super(...args);

        this.stuff = Game.rooms[this.memory.stuff];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
        console.log('printing stuff about this process');
    }

    someOtherFunction() {
        return (this.stuff.controller.level < 5 && this.stuff.storage === undefined);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = ExampleProcess;