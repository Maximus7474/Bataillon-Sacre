const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { PermissionsBitField, Embed } = require('discord.js');
const { executeStatement } = require('../utils/database/sqliteHandler');

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('valider')
        .setDescription('Valider une inscription, renseigner un argument')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .addStringOption(option => 
            option.setName('pseudo')
            .setDescription('le pseudo a valider')
            .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('id')
            .setDescription('l\'ID discord a valider')
            .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('email')
            .setDescription('l\'email a valider')
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const email = interaction.options.getString('email')
        const pseudo = interaction.options.getString('pseudo')
        const id = interaction.options.getString('id')

        console.log(email, pseudo, id)

        if (email == null && pseudo == null && id == null) {
            const failedEmbed = new EmbedBuilder()
                .setTitle("Impossible")
                .setDescription("Merci de renseigner un des trois arguments disponible:\n- pseudo\n- discord ID\n- email")
                .setColor(0xFF0000)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
            await interaction.reply({
                embeds: [failedEmbed]
            })
            return
        }

        const date = new Date()
        const timestamp = Math.round(date.getTime() / 1000);
        let result = "";
        if (pseudo !== null) {
            result = await executeStatement("UPDATE users SET joined_date = ? WHERE joined_date = NULL AND username = ?;", [timestamp, pseudo])
        } else if (id !== null)  {
            result = await executeStatement("UPDATE users SET joined_date = ? WHERE joined_date = NULL AND  discord_id = ?;", [timestamp, id])
        } else if (email !== null) {
            result = await executeStatement("UPDATE users SET joined_date = ? WHERE joined_date = NULL AND  email = ?;", [timestamp, email])
        }

        if ( result === 1 ) {
            const successEmbed = new EmbedBuilder()
                .setTitle('Inscription Validée')
                .setDescription(`L'inscription pour: \`${pseudo ? pseudo : (id ? id : email)}\` a été valider avec succès`)
                .setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.avatar ? interaction.member.displayAvatarURL({ dynamic: true, format: 'png', size: 64 }) : (interaction.user.avatar ? interaction.user.avatarURL({ dynamic: true, format: 'png', size: 64 }) : null)})
            await interaction.reply({
                embeds: [successEmbed]
            })
        } else {
            const failedEmbed = new EmbedBuilder()
                .setTitle("Erreure")
                .setDescription(`L'argument fourni n'as pas été trouvé dans la base de donnée d'inscriptions **ou** l'inscription a déjà été validée.
                Vous pouvez chercher si un utilisateur a une inscription avec \`info email\` ou \`info membre\`.`)
                .setColor(0xFF0000)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 128 }));
            await interaction.reply({
                embeds: [failedEmbed]
            })
        }
    }
}