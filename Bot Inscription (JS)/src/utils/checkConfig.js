const fs = require('fs');
const path = require('path');

const log = new require('./logger.js');
const logger = new log("Config Checker");

try {
    
} catch (error) {
    return logger.warn('Impossible to check config structure with the template as it doesn\'t exist');
}

function checkKeys(obj1, obj2) {
    for (let key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            if (typeof obj1[key] === 'object' && obj1[key] !== null) {
                obj2[key] = checkKeys(obj1[key], obj2[key] || {});
            } else {
                if (!(key in obj2)) {
                    logger.warn(`Key '${key}' is missing in obj2.`);
                    obj2[key] = obj1[key];
                }
            }
        }
    }
    return obj2;
}

function writeJSONFile(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
        logger.info(`Successfully updated '${filename}'.`);
    } catch (err) {
        logger.error('Error writing file:', err);
    }
}

function compareAndUpdateConfigFiles() {
    try {
        const templateConfig = require ('../config.template.json');
        const config = require('../config.json');

        if (!templateConfig || !config) {
            return false;
        }

        const updatedConfig = checkKeys(templateConfig, config);

        writeJSONFile(
            path.join(__dirname, '../config.json'),
            updatedConfig
        );

    } catch (error) {
        logger.warn('Impossible to check config structure with the template or the config don\'t exist');
    }
}

module.exports = { compareAndUpdateConfigFiles }