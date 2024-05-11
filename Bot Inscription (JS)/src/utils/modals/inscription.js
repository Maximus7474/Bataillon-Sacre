const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { channels, colors } = require('../../config.json');
const { executeStatement } = require('../database/sqliteHandler');

const cleanStringToList = (inputString) => {
    const stringArray = inputString.split('\n');
    
    const cleanedArray = stringArray.map((str) => str.trim());
    
    return JSON.stringify(cleanedArray);
};

const modalCustomId = "inscriptionModal"

const inscriptionModal = new ModalBuilder()
    .setCustomId(modalCustomId)
    .setTitle('Formulaire d\'inscription');

const emailInput = new TextInputBuilder()
    .setCustomId('emailInput')
    .setPlaceholder('email@email.com')
    .setRequired(true)
    .setLabel("Quel est votre email?")
    .setStyle(TextInputStyle.Short);

const identifierInput = new TextInputBuilder()
    .setLabel('Vos identifiants de jeu, format a respecté')
    .setCustomId('identifierInput')
    .setPlaceholder('(Optionnel)\nsteam:789123456\nhttps://steamcommunity.com/id/iweester/\nepic:123546789')
    .setRequired(true)
    .setStyle(TextInputStyle.Paragraph);

const languageInput = new TextInputBuilder()
    .setLabel('Parlez vous le français?')
    .setCustomId('languageInput')
    .setPlaceholder('Oui / Non')
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

const firstActionRow = new ActionRowBuilder().addComponents(emailInput);
const secondActionRow = new ActionRowBuilder().addComponents(identifierInput);
const thirdActionRow = new ActionRowBuilder().addComponents(languageInput);

inscriptionModal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

async function inscriptionModalHandler (client, interaction) {
	if (!interaction.isModalSubmit() && interaction.setCustomId !== modalCustomId) return;

	const email = interaction.fields.getTextInputValue('emailInput');
	const identifiers = cleanStringToList(interaction.fields.getTextInputValue('identifierInput'));
    const language = interaction.fields.getTextInputValue('languageInput');

    const username = interaction.user.username;
    const discordID = interaction.user.id;

    const Embed = new EmbedBuilder()
        .setTitle('Réponse Inscription')
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 }) })
        .setDescription(
            `Inscription venant de: <@${discordID}> (${username})
            > - Email: \`${email}\`
            > - Identifiants:\n\`\`\`m\n${identifiers !== '[""]' ? "- " + JSON.parse(identifiers).join('\n- ') : "Aucun Partagé"}\n\`\`\`
            > - Parle le français: ${language}`
        )
        .setColor(colors.base);

    const responseEmbed = new EmbedBuilder()
        .setTitle('Inscription envoyée')
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ format: 'png', size: 64 }) })
        .setImage(interaction.guild.bannerURL({ format: 'png', size: 96 }));

    const channelID = channels.inscriptionlog;
    const channel = await client.channels.cache.get(channelID);

    if (channel) {
        channel.send({ embeds: [Embed] });

        const insertUserSQL = `INSERT INTO users (username, discord_id, email, game_identifiers, parle_fr) VALUES (?, ?, ?, ?, ?)`;
        executeStatement(insertUserSQL, [username, discordID, email, identifiers, language])
            .then((result) => {
                console.log('User inserted successfully with ID:', result);
            })
            .catch((err) => {
                console.error('Error inserting user:', err);
            });

        return interaction.reply({
            embeds: [responseEmbed],
            ephemeral :true
        })
    } else {
        console.error("Channel was not found:", channels.inscriptionlog, channel)
    }
};

module.exports = { inscriptionModal, inscriptionModalHandler };
