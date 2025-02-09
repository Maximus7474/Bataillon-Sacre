CREATE TABLE IF NOT EXISTS `forum-roles` (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT UNIQUE NOT NULL,
    role_id TEXT NOT NULL,
    added INTEGER DEFAULT (strftime('%s', 'now')),
    added_by TEXT DEFAULT '{ "username": "SYSTEM", "id": "SYSTEM" }'
);