const Discord = require("discord.js");

const { guild_id, roles } = require('../config.json');

const log = new require('../utils/logger.js');
const logger = new log("MemberJoin");

module.exports = {
    event: Discord.Events.GuildMemberAdd,
    type: "on",
    async call(client, member) {
        const { guild, user } = member;

        if (guild.id !== guild_id) return;

        for (const roleId of roles.visiteur) {
            const role = guild.roles.fetch(roleId);
            if (role) {
                member.roles.remove(role)
                .catch(err => logger.error(`Unable to add role ${role.name} (${roleId}) to @${user.username} (${user.id}):\n`, err));
            }
        }
    }
}