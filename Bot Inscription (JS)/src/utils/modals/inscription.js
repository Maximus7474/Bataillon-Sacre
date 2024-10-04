const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, MessageEmbed } = require('discord.js');
const { channels, colors } = require('../../../config.json');
const { executeStatement, executeQuery } = require('../database/sqliteHandler');

const log = require('../logger');
const logger = new log('inscription');

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
    .setLabel("Adresse email : ")
    .setStyle(TextInputStyle.Short);

const identifierInput = new TextInputBuilder()
    .setLabel('Identifiants (Steam, Epicgames, …) :')
    .setCustomId('identifierInput')
    .setPlaceholder('(Optionnel)\nsteam:789123456\nhttps://steamcommunity.com/id/iweester/\nepic:123546789\nOu autres')
    .setRequired(true)
    .setStyle(TextInputStyle.Paragraph);

const rulesInput = new TextInputBuilder()
    .setLabel('Approuvez-vous le règlement?')
    .setCustomId('rulesInput')
    .setPlaceholder('Oui / Non')
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

const firstActionRow = new ActionRowBuilder().addComponents(emailInput);
const secondActionRow = new ActionRowBuilder().addComponents(identifierInput);
const thirdActionRow = new ActionRowBuilder().addComponents(rulesInput);

inscriptionModal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

async function inscriptionModalHandler (client, interaction) {
	if (!interaction.isModalSubmit() && interaction.setCustomId !== modalCustomId) return;

	const email = interaction.fields.getTextInputValue('emailInput');
	const identifiers = cleanStringToList(interaction.fields.getTextInputValue('identifierInput'));
    const rules = interaction.fields.getTextInputValue('rulesInput');

    const username = interaction.user.username;
    const discordID = interaction.user.id;

    const Embed = new EmbedBuilder()
        .setTitle('Réponse Inscription')
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 }) })
        .setDescription(
            `Inscription venant de: <@${discordID}> (${username})
            > - Email: \`${email}\`
            > - Identifiants:\n\`\`\`m\n${identifiers !== '[""]' ? "- " + JSON.parse(identifiers).join('\n- ') : "Aucun Partagé"}\n\`\`\`
            > - Approuve le règlement: ${rules}`
        )
        .setColor(colors.base);
    
    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('signupValidate')
                .setLabel('Valider')
                .setStyle('Success'),
            new ButtonBuilder()
                .setCustomId('signupCancel')
                .setLabel('Refuser')
                .setStyle('Danger')
        );
    
    const responseEmbed = new EmbedBuilder()
        .setTitle('Inscription envoyée')
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ format: 'png', size: 64 }) })
        .setImage(interaction.guild.bannerURL({ format: 'png', size: 96 }));

    const channelID = channels.inscriptionLog;
    const channel = await client.channels.cache.get(channelID);

    if (channel) {
        channel.send({ embeds: [Embed], components: [buttons] });

        const result = await executeQuery('SELECT `id` FROM users WHERE discord_id = ?;', [discordID])

        const sqlQuery = result === undefined ? 'INSERT INTO users (username, discord_id, email, game_identifiers, reglement) VALUES (?, ?, ?, ?, ?);' : "UPDATE users SET username = ?, email = ?, game_identifiers = ?, reglement = ?, signup_date = strftime('%s', 'now') WHERE discord_id = ?"
        const sqlParams = result === undefined ? [username, discordID, email, identifiers, rules] : [username, email, identifiers, rules, discordID];
    
        executeStatement(sqlQuery, sqlParams)
            .then((result) => {
                logger.info('User inserted/updated successfully with ID:', result);
            })
            .catch((err) => {
                logger.error('Error inserting/updating user:', err || 'unknown', 'Request: ', sqlQuery, sqlParams);
            });
    
        interaction.reply({
            embeds: [responseEmbed],
            ephemeral: true
        });
    } else {
        logger.error("Channel was not found:", channels.inscriptionLog, channel);
    }
};

async function inscriptionValidationHandler (interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'signupValidate' || interaction.customId === 'signupCancel') {

        const { guild, channel, user } = interaction;
        const discordID = user.id;

        const Embed = EmbedBuilder.from(interaction.message.embeds[0]);

        const discordIdRegex = /<@(\d+)>/;
        const match = discordIdRegex.exec(interaction.message.embeds[0].description);
        const targetDiscordID = match ? match[1] : null;

        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        let successfulNotify = false
        
        try {
            const user = await interaction.client.users.fetch(targetDiscordID);
            await user.send(interaction.customId === 'signupValidate' ? 'Votre inscription a été validée' : 'Votre inscription a été refusée');
            successfulNotify = true;
        } catch (err) {
            logger.error(`Error sending DM to ${targetDiscordID}:`, err);
        }

        console.log('Current Embed', Embed.fields, Embed.footer, Embed);

        Embed.addFields(interaction.customId === 'signupValidate' ? {
                name: 'Validée par:', value: `> <@${discordID}> le <t:${currentTimestamp}>`
            } : {
                name: 'Annulée par:', value: `> <@${discordID}> le <t:${currentTimestamp}>`
            })
            .setFooter(interaction.customId === 'signupValidate' ? {
                text: `Inscription validée. ${successfulNotify ? 'Joueur informé' : ':warning: Joueur pas informé'}`
            } : {
                text: `Inscription annulée. ${successfulNotify ? 'Joueur informé' : ':warning: Joueur pas informé'}`
            });

        console.log('New Embed', Embed.fields, Embed.footer);

        await interaction.message.edit({ embeds: [Embed], components: [] })
            .then(udpated => logger.info('Message updated', udpated.id, 'by:', discordID, 'for:', targetDiscordID))
            .catch(err => logger.error('Impossible to update', targetDiscordID, 'error:', err));

        if (interaction.customId === 'signupValidate') {

            const updateSignupDateSQL = `
                UPDATE users
                SET signup_date = strftime('%s', 'now')
                WHERE discord_id = ?
            `;

            executeStatement(updateSignupDateSQL, [targetDiscordID])
                .then(response => logger.info('Updated', targetDiscordID, 'as joined', `(${response})`))
                .catch(err => logger.error('Unable to update',targetDiscordID, err));
        }
    }
}

module.exports = {
    inscriptionModal, inscriptionModalHandler, inscriptionValidationHandler
};
