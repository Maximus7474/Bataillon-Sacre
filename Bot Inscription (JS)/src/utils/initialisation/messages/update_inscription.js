const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');

const { channels } = require('../../../config.json');
const { inscriptionModal } = require('../../modals/inscription');

const buttonID = 'ouvrirInscription';

function createSignUpEmbedWithButton() {
    const embed = new EmbedBuilder()
        .setTitle('Inscription')
        .setDescription('Pour rejoindre le Bataillon sacré vous pouvez formuler votre candidature ci-dessous en cliquant sur le bout.')
        .setImage("https://cdn.discordapp.com/attachments/957052651902738433/1235595707549749278/wp3126790rr.jpg");

    const button = new ButtonBuilder()
        .setCustomId(buttonID)
        .setLabel('Inscription')
        .setStyle(1)
        .setEmoji('📩');

    const row = new ActionRowBuilder()
        .addComponents(button);

    return { embed, components: [row] };
}


async function handleSignUpButtonInteraction(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === buttonID) {
        await interaction.showModal(inscriptionModal);
    }
}

async function checkLastSignUpMessage(client) {
    try {
        const channelId = channels.inscriptionmessage;
        const channel = client.channels.cache.get(channelId);


        const messages = await channel.messages.fetch({ limit: 5 });
        const clientMessage = messages.find(msg => msg.author.id === channel.client.user.id);

        if (!clientMessage) {
            const { embed, components } = createSignUpEmbedWithButton();
            await channel.send({ embeds: [embed], components: components });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

module.exports = { createSignUpEmbedWithButton, handleSignUpButtonInteraction, checkLastSignUpMessage };
