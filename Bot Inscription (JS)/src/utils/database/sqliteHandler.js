const sqlite3 = require('sqlite3').verbose();

// Function to initialize the database
const initializeDatabase = () => {
    const db = new sqlite3.Database(`./data.db`);
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            discord_id INTEGER,
            date INTEGER DEFAULT (strftime('%s', 'now')),
            email TEXT,
            game_identifiers TEXT
        );`);
        console.log('Database initialized.');
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
                console.error('Error executing SQL statement:', err);
                reject(err);
            } else {
                console.log('SQL statement executed successfully.');
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
                        console.error('Error executing SQL statement:', err);
                        db.run('ROLLBACK;');
                        reject(err);
                        return;
                    }
                });
            });
            db.run('COMMIT;', function (err) {
                if (err) {
                    console.error('Error committing transaction:', err);
                    db.run('ROLLBACK;');
                    reject(err);
                    return;
                }
                console.log('Transaction committed successfully.');
                resolve(true);
            });
        });
        db.close();
    });
};

module.exports = {
    initializeDatabase,
    executeStatement,
    executeTransaction
};
