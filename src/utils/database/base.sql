CREATE TABLE IF NOT EXISTS `forum-roles` (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT UNIQUE NOT NULL,
    role_id TEXT NOT NULL,
    added INTEGER DEFAULT (strftime('%s', 'now')),
    added_by TEXT DEFAULT '{ "username": "SYSTEM", "id": "SYSTEM" }'
);

CREATE TABLE IF NOT EXISTS `upcoming_events` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `thread_id` TEXT NUT NULL,
    `message_id` TEXT NUT NULL,

    `added` INTEGER DEFAULT (strftime('%s', 'now')),
    `added_by` TEXT NOT NULL,
    
    `role_id` TEXT DEFAULT NULL,
    `title` TEXT NOT NULL,
    `image` TEXT DEFAULT NULL,
    `date` INTEGER NOT NULL,
    `duration` INTEGER DEFAULT 1,
    `description` TEXT DEFAULT "",
    `location` TEXT DEFAULT "N/A"
);

CREATE TABLE IF NOT EXISTS event_participants (
    `event_id` INTEGER NOT NULL,
    `updated` INTEGER DEFAULT (strftime('%s', 'now')),
    `user_id` TEXT NOT NULL,
    `participating` INTEGER DEFAULT 0,
    PRIMARY KEY (event_id, user_id)
);
