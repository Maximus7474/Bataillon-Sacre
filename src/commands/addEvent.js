const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { DateTime } = require('luxon');
const { addNewEvent } = require('../handlers/custom/game_event_handler');

const { colors } = require('../config.json');

// const log = new require('../utils/logger.js');
// const logger = new log("Event Add");

const convertToDateInParis = (dateString) => {
    const regex = /^([0-2][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})(?:\s([01][0-9]|2[0-3]):([0-5][0-9]))?$/;
    const match = dateString.match(regex);

    if (!match) return null;

    const [, day, month, year, hours, minutes] = match;

    const dt = DateTime.fromObject(
        {
            day: parseInt(day),
            month: parseInt(month),
            year: parseInt(year),
            hour: parseInt(hours ?? "0"),
            minute: parseInt(minutes ?? "0"),
        },
        { zone: "Europe/Paris" }
    );

    if (!dt.isValid) return null;

    return dt.toJSDate();
};

module.exports = {
    register_command: new SlashCommandBuilder()
        .setName('evenement')
        .setDescription('Create a new event')
        .setDescriptionLocalization('fr', 'Créer un nouvel évènement avec inscription')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageEvents)
        .addStringOption(o =>
            o.setName('title')
            .setNameLocalization('fr', 'titre')
            .setDescription('Set the event title')
            .setDescriptionLocalization('fr', 'Le titre de l\'évènement')
            .setMaxLength(100)
            .setMinLength(6)
            .setRequired(true)
        )
        .addStringOption(o =>
            o.setName('date')
            .setNameLocalization('fr', 'date')
            .setDescription('Set the event start date, under this format: DD/MM/YYYY HH:MM (the time can be ignored)')
            .setDescriptionLocalization('fr', 'La date de l\'évènement, avec ce format: DD/MM/YYYY HH:MM (l\'heure peut être négliger)')
            .setMaxLength(16)
            .setMinLength(10)
            .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName('duration')
            .setNameLocalization('fr', 'duree')
            .setDescription('(optional) The maximum duration of the event in hours.')
            .setDescriptionLocalization('fr', '(optionnel) La durée maximale de l\'évènement en heures.')
            .setMinValue(1)
            .setMaxValue(5)
        )
        .addStringOption(o =>
            o.setName('image')
            .setDescription('(optional) An image to display, paste the image url')
            .setDescriptionLocalization('fr', '(optionnel) Un liens d\'une image pour décorer')
        )
        .addRoleOption(o =>
            o.setName('role')
            .setDescription('(optional) A role to mention when sharing the event')
            .setDescriptionLocalization('fr', '(optionnel) Un rôle a mentioner lors du partage de l\'event')
        ),
    async execute(client, interaction) {
        const { user, options } = interaction;
    
        const dateString = options.getString('date')
        const date = convertToDateInParis(dateString);
        if (isNaN(date)) {
            return interaction.reply({ content: 'Invalid date format.', ephemeral: true });
        }
        if (date < new Date()) return interaction.reply({ content: 'Alors là l\'évent aurais déjà débuté chef.', ephemeral: true });
    
        const duration = dateString.length <= 10 ? 24 : options.getInteger('duration') || 1;
        const title = options.getString('title');
        const image = options.getString('image') || null;
        const role = options.getRole('role') || null;
    
        let eventData = {
            title,
            duration,
            date,
            image,
            role: role ? role.id : null,
        };
    
        const customId = 'collector_event_description';
        const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle('Description de l\'Event')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('Saisissez les détails de l\'évènment')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMinLength(0)
                    .setMaxLength(2000)
                    .setRequired(true)
            )
        );

        await interaction.showModal(modal);

        const filter = (i) => i.user.id === user.id && i.customId === customId;
        const collected = await interaction.awaitModalSubmit({
            filter,
            time: 60000,
        }).catch(() => {
            interaction.followUp({ content: 'Vous avez pris trop de temps a répondre.', ephemeral: true });
        });

        if (!collected) return;

        const description = collected.fields.getTextInputValue('description').trim();
        eventData.description = description;

        await collected.reply({
            embeds: [new EmbedBuilder()
                .setTitle(`Nouveau Event: ${eventData.title}`)
                .setColor(colors.admin)
                .setDescription(`- Date: <t:${Math.round(eventData.date.getTime()/1000)}>\n- Durée: ${eventData.duration} hours\n- Détails:\n>>> ${eventData.description}`)
                .setThumbnail(eventData.image ?? interaction.guild.iconURL({extension: 'webp', size: 256}))
                .setAuthor({name: client.user.globalName || "Événementiel", iconURL: client.user.displayAvatarURL({ dynamic: true, format: 'webp', size: 64 })})
            ],
            // content: `Event created successfully!\nTitle: ${eventData.title}\n`,
            ephemeral: true,
        });

        addNewEvent(client, user, eventData);
    }        
}