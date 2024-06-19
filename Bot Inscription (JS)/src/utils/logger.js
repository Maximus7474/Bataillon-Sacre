const colors = require('colors/safe');

class Logger {
    constructor(origin) {
        this.origin = origin
    }
    info(message, ...args) {
        console.log(`${colors.gray((new Date()).toLocaleString())} ${colors.cyan(`[${this.origin}] [INFO]`)} ${message}`, ...args);
    }

    success(message, ...args) {
        console.log(`${colors.gray((new Date()).toLocaleString())} ${colors.green(`[${this.origin}] [SUCCESS]`)} ${message}`, ...args);
    }

    warn(message, ...args) {
        console.warn(`${colors.gray((new Date()).toLocaleString())} ${colors.yellow(`[${this.origin}] [WARN]`)} ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`${colors.gray((new Date()).toLocaleString())} ${colors.red(`[${this.origin}] [ERROR]`)} ${message}`, ...args);
    }
}

module.exports = Logger;