const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const log = new require('../logger.js')
const logger = new log("SignupMessage")

const { channels, colors } = require('../../config.json');
const { inscriptionModal } = require('../modals/inscription');

const buttonID = 'ouvrirInscription';

function createSignUpEmbedWithButton() {
    const embed = new EmbedBuilder()
        .setTitle('Inscription')
        .setDescription('Pour rejoindre le Bataillon sacré vous pouvez formuler votre candidature ci-dessous en cliquant sur le bouton.')
        .setColor(colors.admin)
        .setFields(
            { name: "<a:fleche:834376849382572082> Liens:", value: "[Groupe Steam](https://steamcommunity.com/groups/bs-commu)\n[Chaîne Youtube](https://www.youtube.com/channel/UCA5SHN5LH3Z7_A7RpG3IYtw)"}
        )
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

module.exports = {
    /* Can also by a simple string */
    customId: [buttonID],
    /* Setup function that is run on client start */
    async setup (client) {
        try {
            const channelId = channels.inscriptionMessage;
            const channel = client.channels.cache.get(channelId);
    
            if (!channel) return logger.warn('No Channel Specified for Signup.');
    
            const messages = await channel.messages.fetch({ limit: 5 });
            const clientMessage = messages.find(msg => msg.author.id === channel.client.user.id);
    
            const { embed, components } = createSignUpEmbedWithButton();
            if (!clientMessage) {
                await channel.send({ embeds: [embed], components: components });
            } else {
                await clientMessage.edit({ embeds: [embed], components: components });
            }
        } catch (error) {
            console.error("Caught Error:", error);
        }
    },
    /* The function called for any interactions created using the specified customId */
    async callback (client, interaction) {
        if (!interaction.isButton()) return;
    
        if (interaction.customId === buttonID) {
            await interaction.showModal(inscriptionModal);
        }
    }
}