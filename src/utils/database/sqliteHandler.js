const log = new require('../logger.js')
const logger = new log("sqlite3") 

const sqlite3 = require('sqlite3').verbose();

// Function to initialize the database
const initializeDatabase = () => {
    const db = new sqlite3.Database(`./data.db`);
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            discord_id TEXT UNIQUE,
            signup_date INTEGER DEFAULT (strftime('%s', 'now')),
            joined_date INTEGER,
            email TEXT,
            game_identifiers TEXT,
            reglement TEXT
        );`);
        logger.info('Database initialized.');
    });
    // Close the database connection
    db.close();
};

// Function to execute a single SQL statement
const executeStatement = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(`./data.db`);
        db.run(sql, params, function (err) {
            if (err) {
                logger.error('- Error executing SQL statement:', `(${sql}) - [${JSON.stringify(params)}]`, err);
                reject(err);
            } else {
                logger.info('SQL statement executed successfully.');
                resolve(this.lastID || this.changes);
            }
        });
        db.close();
    });
};

// Function to execute multiple SQL statements in a transaction
const executeTransaction = (statements) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(`./data.db`);
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            statements.forEach(({ sql, params = [] }) => {
                db.run(sql, params, function (err) {
                    if (err) {
                        logger.error('Error executing SQL statement:', `(${JSON.stringify(statements)})`, err);
                        db.run('ROLLBACK;');
                        reject(err);
                        return;
                    }
                });
            });
            db.run('COMMIT;', function (err) {
                if (err) {
                    logger.error('Error committing transaction:', err);
                    db.run('ROLLBACK;');
                    reject(err);
                    return;
                }
                logger.info('Transaction committed successfully.');
                resolve(true);
            });
        });
        db.close();
    });
};

const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(`./data.db`);
        db.get(sql, params, function (err, row) {
            if (err) {
                logger.error('Error executing SQL statement:', `(${sql}) - [${JSON.stringify(params)}]`, err);
                reject(err);
            } else {
                logger.info('SQL statement executed successfully.');
                resolve(row); // Resolve with the single row
            }
        });
        db.close();
    });
};

module.exports = {
    initializeDatabase,
    executeStatement,
    executeTransaction,
    executeQuery
};
