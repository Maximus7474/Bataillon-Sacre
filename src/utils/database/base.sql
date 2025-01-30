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

CREATE TABLE IF NOT EXISTS `forum-roles` (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT UNIQUE NOT NULL,
    role_id TEXT NOT NULL,
    added INTEGER DEFAULT (strftime('%s', 'now')),
    added_by TEXT DEFAULT '{ "username": "SYSTEM", "id": "SYSTEM" }'
);