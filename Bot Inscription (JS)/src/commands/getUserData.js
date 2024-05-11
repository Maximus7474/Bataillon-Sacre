const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { executeQuery } = require('../utils/database/sqliteHandler');

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Ouvrir le formulaire d\'inscription')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .addSubcommand( subcommand =>
            subcommand
                .setName('membre')
                .setDescription('Recherche par Membre')
                .addUserOption(option => 
                    option.setName('membre')
                    .setDescription('Le Membre')
                    .setRequired(true)
                )
         )
         .addSubcommand( subcommand =>
             subcommand
                 .setName('email')
                 .setDescription('Recherche par email')
                 .addStringOption(option => 
                    option.setName('email')
                    .setDescription('L\'email recherché')
                    .setRequired(true)
                )
          ),
    async execute(client, interaction) {
        let query = "";
        let value = "";
        let fields = [];
        if (interaction.options._subcommand === "membre") {
            query = `SELECT * FROM users WHERE discord_id =? ;`
            value = interaction.options.getUser('membre').id
        } else {
            query = `SELECT * FROM users WHERE email = ?;`
            value = interaction.options.getString('email')
        }

        const result = await executeQuery(query, [value])

        try {
            const member = interaction.guild.members.cache.get(result.discord_id);
            let roles = member.roles.cache.map(role => `<@&${role.id}>`)
            roles.pop()
            fields.push({
                name: "➣ __Info Membre__",
                value: `ID: \`${member.id}\`
                Création: <t:${Math.round(member.user.createdTimestamp/1000)}:F>
                Join Serveur: ${member.joinedTimestamp ? "<t:" + Math.round(member.joinedTimestamp/1000) + ":R>" : "Introuvable"}
                Roles: ${roles.join(', ')}`,
                inline: false
            })
        } catch (error) {
            fields.push({
                name: "➣ __Info Membre__", value: ":warning: Membre plus présent sur le discord.", inline: true
            })
        }

        if (result) {
            fields.push({
                name: "➣ __Info Inscription__",
                value: `ID: \`${result.id}\`
                Nom d'utilisateur: \`${result.username}\`
                Email: \`${result.email}\`
                Date d'inscription: <t:${result.signup_date}:R>
                Date d'intégration: ${result.joined_date !== null ? `<t:${result.joined_date}:d>` : "**\`N'as pas encore été accepté\`**"}
                Parle français: \`${result.parle_fr}\`
                Identifiants:
                \`\`\`m\n${"- " + JSON.parse(result.game_identifiers).join('\n- ')}\n\`\`\``,
                inline: false
            })
        } else {
            fields.push({
                name: "➣ __Info Inscription__", value: ":warning: Aucune inscription trouvée", inline: true
            })
        }

        const resultEmbed = new EmbedBuilder()
            .setTitle(`Recherche pour: ${interaction.options._subcommand}`)
            .setDescription(result ? "Membre étant inscrit ou ayant été inscrit au Bataillon sacré" : "Membre n'étant pas actuellement inscrit")
            .setFields(fields)
            .setAuthor({
                name: interaction.options._subcommand === "membre" ? interaction.options.getUser('membre').displayName : result.username,
                iconURL: interaction.options._subcommand === "membre" ? interaction.options.getUser('membre').avatarURL({ dynamic: true, format: 'png', size: 64 }) : client.user.avatarURL({ dynamic: true, format: 'png', size: 64 })
            })
        
        await interaction.reply({
            embeds: [resultEmbed],
            ephemeral: true
        })
    }
}