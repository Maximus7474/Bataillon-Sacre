const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js')

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong ?'),
    async execute(client, interaction) {
        const responseEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Pong ?')
            .setDescription(`${client.ws.ping}ms`)
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true, format: 'png', size: 64 }) })
            // .setImage()
            .setTimestamp();
        return interaction.reply({
            embeds: [responseEmbed],
            ephemeral :true
        })
    }
}