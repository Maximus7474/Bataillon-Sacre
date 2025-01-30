CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    discord_id TEXT UNIQUE,
    signup_date INTEGER DEFAULT (strftime('%s', 'now')),
    joined_date INTEGER,
    email TEXT,
    game_identifiers TEXT,
    reglement TEXT
);
