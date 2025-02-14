const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const { executeStatement } = require('../utils/database/sqliteHandler');

const { colors } = require('../config.json');

const log = new require('../utils/logger');
const logger = new log("GameForum - Command") ;

module.exports = {
    guildOnly: true,
    register_command: new SlashCommandBuilder()
        .setName('ajouter_role_jeux')
        .setDescription('Ajouter un salon de forum comme sélecteur de jeux avec l\'émoji "✅"')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .addChannelOption(o =>
            o.setName('salon')
            .setDescription('Le salon a utiliser')
            .setRequired(true)
        )
        .addRoleOption(o=>
            o.setName('role')
            .setDescription('Role à ajouter/retirer')
            .setRequired(true)
        ),
    async execute(client, interaction) {

        const { user, options, guild } = interaction;

        const channel = options.getChannel('salon');
        const role = options.getRole('role');

        const botMember = guild.members.me;
        if (role.position >= botMember.roles.highest.position) return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('Impossible')
                .setDescription(`Je ne peux pas attribuer le rôle <@&${role.id}>, car mon rôle le plus élevé est <@&${botMember.roles.highest.id}>, qui est plus bas dans la hiérarchie.`)
                .setColor('DarkRed')
                .setThumbnail(guild.iconURL({ dynamic: false, format: 'webp', size: 128 }))
            ],
            ephemeral :true
        });

        if (!channel?.isThread()) return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('Impossible')
                .setDescription(`Le salon fourni (<#${channel.id}>) n'est pas un forum.`)
                .setColor('DarkRed')
                .setThumbnail(guild.iconURL({ dynamic: false, format: 'webp', size: 128 }))
            ],
            ephemeral :true
        });

        await interaction.deferReply({ ephemeral :true });

        executeStatement(
            'INSERT INTO `forum-roles` (post_id, role_id, added_by) VALUES (?,?,?)',
            [
                channel.id, role.id,
                JSON.stringify({ username: user.username, id: user.id })
            ]
        )
        .then(r => {
            channel.join();
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Jeux ajouter")
                    .setDescription(
                        `Le rôles <@&${role.id}> a été repertorié pour être ajouter aux réactions ✅ sur le message d'ouverture de <#${channel.id}>`
                    )
                    .setColor(colors.base)
                    .setThumbnail(guild.iconURL({ dynamic: false, format: 'webp', size: 128 }))
                ],
                ephemeral :true
            });
        })
        .catch(err => {
            logger.error(`Unable to add ${role.name} (${role.id}) to DB for ${channel.name} (${channel.id})`)
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Une erreure est survenu")
                    .setDescription(
                        `La requête n'as pas pu aboutir à cause d'une erreure en BDD.\n` +
                        "```ansi\n" + `[0;31m${err?.message || 'Inconnu'}\n` + "```"
                    )
                ]
            });
        });
    }
}