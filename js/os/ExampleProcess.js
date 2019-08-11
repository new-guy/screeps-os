const Process = require('Process');

class ExampleProcess extends Process {
    constructor (...args) {
        super(...args);

        console.log('printing stuff about this process');
        this.stuff = Game.rooms[this.memory.stuff];
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }

    someOtherFunction() {
        return (this.stuff.controller.level < 5 && this.stuff.storage === undefined);
    }

    processShouldDie() {
        return false;
    }
}

module.exports = ExampleProcess;