const cron = require('node-cron');
const { executeQuery, executeStatement } = require('../../utils/database/sqliteHandler');

const log = new require('../../utils/logger.js');
const logger = new log("AntiPostArchiver");

const initializeAntiPostArchiver = (client) => {
    cron.createTask('0 0 13 */6 * * *', async () => {
        executeQuery('SELECT post_id FROM "forum-roles"', [], 'all')
        .then(async (channels) => {
            const deleted = 0;
            logger.info('Running de-archiver for', channels.length, 'channels');

            for (let i = 0; i < channels.length; i++) {
                const postId = channels[i].post_id;
                try {
                    const post = await client.channels.fetch(postId);

                    const msg = await post.send('Reopening');

                    logger.info('Sent message to', post?.name, post.id);

                    setTimeout(() => {
                        msg.delete();
                    }, 1000);
                } catch (err) {
                    logger.error('Unable to de-archive', postId, 'reason:', err.message);
                    logger.error('Deleting from database...');
                    executeStatement('DELETE FROM "forum-roles" WHERE post_id = ?', [postId]);
                    deleted++;
                }
            }

            logger.success(`De-archived ${channels.length - deleted} channels and deleted ${deleted} unknown channels.`)
        })
        .catch(err => {
            logger.error('Unable to initialize anti post archiver', err);
        });
    });
}

module.exports = { initializeAntiPostArchiver };