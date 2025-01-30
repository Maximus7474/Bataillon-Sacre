const { Events } = require("discord.js")

const { executeQuery } = require("../utils/database/sqliteHandler");

const log = new require('../utils/logger.js')
const logger = new log("GameForum - Remove") 

const trackedEmoji = '✅';

module.exports = {
    event: Events.MessageReactionRemove,
    type: "on",
    async call(client, reaction, user, details) {

        const { message, _emoji } = reaction;

        if ( _emoji.name !== trackedEmoji) return;

        const { role_id } = (await executeQuery('SELECT role_id FROM "forum-roles" WHERE post_id = ?', message.channelId)) || { role_id: null };

        if (!role_id) return;

        const guild = await client.guilds.fetch(message.guildId);

        const member = await guild.members.fetch({ user, cache: false });

        if (!member) return logger.error(`Can't give role (${role_id}) to ${user.username}, unable to fetch${!member ? ' his member obj' : ''}`);

        try {
            await member.roles.remove(role_id, `Désélection du jeux dans <#${message.channelId}>`);
        } catch (err) {
            logger.error(`Unable to remove role (${role_id}) from ${user.username}:`, err.message);
        }
    },
}