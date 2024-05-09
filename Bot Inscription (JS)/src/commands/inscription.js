const { SlashCommandBuilder } = require('@discordjs/builders');
const { inscriptionModal } = require('../utils/modals/inscription');

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('inscription')
        .setDescription('Ouvrir le formulaire d\'inscription'),
    async execute(client, interaction) {
        await interaction.showModal(inscriptionModal);
    }
}