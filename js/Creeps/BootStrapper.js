const Creep = require('Creep');

class BootStrapper extends Creep {
    constructor (...args) {
        super(...args);
    }

    update() {
        if(super.update() == 'exit') {
            return 'exit';
        }
    }
}

module.exports = BootStrapper;