const { executeStatement, executeQuery } = require("../../utils/database/sqliteHandler");
const { EmbedBuilder, ThreadAutoArchiveDuration, ChannelType, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const { channels, colors, guild_id } = require('../../config.json');

const log = new require('../../utils/logger.js');
const logger = new log("Event Handler");

let currentEvents = {};

setTimeout(() => {
    const time = new Date();
    executeQuery('SELECT `id`, `date`, `thread_id`, `message_id`, `duration`, `title` FROM upcoming_events WHERE date > ?', [time.getTime()], 'all')
    .then(r => {
        r.forEach(element => {
            currentEvents[element.id] = {
                ...element,
                date: (new Date(element.date))
            };
        });

        logger.success(`Loaded`, r.length, 'events.')
    })
    .catch((r) => {
        logger.error('Unable to load events', r)
    });
}, 500);

const generateButtons = async (eventId, queryDB) => {
    const query = `SELECT COUNT(CASE WHEN participating = 1 THEN 1 END) AS joined, COUNT(CASE WHEN participating = 0 THEN 1 END) AS absent FROM event_participants WHERE event_id = ?`;
    const results = queryDB ? await executeQuery(query, [eventId]) : [{joined: 0, absent: 0}];

    const row = new ActionRowBuilder();
  
    row.addComponents(
        new ButtonBuilder()
        .setCustomId(`event_participation_${eventId}_join`)
        .setLabel(`Participer${results.joined > 0 ? ` (${results.joined})` : ''}`)
        .setStyle(ButtonStyle.Success)
        // .setEmoji(null)
    );

    row.addComponents(
        new ButtonBuilder()
        .setCustomId(`event_participation_${eventId}_leave`)
        .setLabel(`Absent${results.absent > 0 ? ` (${results.absent})` : ''}`)
        .setStyle(ButtonStyle.Danger)
        // .setEmoji(null)
    );

    return row;
}

const addNewEvent = async (client, user, eventData) => {
    const guild = await client.guilds.fetch(guild_id);
    const channel = await client.channels.fetch(channels.events);
    const imageUrl = eventData.image ?? guild.iconURL({extension: 'webp', size: 256});

    const embed = new EmbedBuilder()
        .setTitle(eventData.title)
        .setDescription(eventData.description)
        .addFields(
            { name: "Horaire:", value: `> <t:${eventData.date.getTime()/1000}> <t:${eventData.date.getTime()/1000}:R>\n${eventData.duration !== 24 ? `> Durée: ${eventData.duration} heure(s)` : ''}` }
        )
        .setColor(colors.base) // #082454
        .setThumbnail(imageUrl);

    const message = await channel.send({
        embeds: [embed]
    });

    const thread = await channel.threads.create({
        name: eventData.title,
        reason: "Salon de papotte pour event",
        type: ChannelType.PrivateThread,
        autoautoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
    });

    const endTime = new Date(eventData.date);
    endTime.setHours(endTime.getHours() + eventData.duration);

    guild.scheduledEvents.create({
        name: eventData.title,
        description: eventData.description,
        image: imageUrl,
        scheduledStartTime: eventData.date,
        scheduledEndTime: endTime,
        entityType: 3,
        privacyLevel: 2,
        entityMetadata: {
            location: 'Ici, la maintenant'
        }
        // entityType: 2,
        // channel: "760253731357851673"
    });

    executeStatement(
        'INSERT INTO upcoming_events (thread_id, message_id, added_by, title, date, duration, description) VALUES (?,?,?,?,?,?,?)',
        [thread.id, message.id, JSON.stringify({id: user.id, username: user.username}), eventData.title, eventData.date, eventData.duration, eventData.description]
    )
    .then(async (id) => {
        currentEvents[id] = {
            ...eventData,
            thread_id: thread.id,
            message_id: message.id
        };

        const row = await generateButtons(id, false);

        message.edit({
            embeds: message.embeds,
            components: [row]
        });
    })
    .catch(err => {
        logger.error('Unable to insert new event in the DB:', err.message);
    });
};

const handleEventParticipation = async (client, interaction) => {
    const { customId, member, guild } = interaction;

    const match = customId.match(/(\d+)/);
    let eventId = false;
    if (match) {
        eventId = Number(match[0]);
    }

    const eventData = currentEvents[eventId];

    const eventEnd = new Date(eventData?.date || 0);
    eventEnd.setHours(eventEnd.getHours() + eventData?.duration || 0);

    if (eventEnd < new Date()) {

        interaction.message.edit({
            embeds: interaction.message.embeds,
            components: []
        })
        .catch(err => console.log('Unable to remove components:', err.message));

        delete currentEvents[eventId];

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('Impossible')
                .setDescription('Cet évènement est terminé.')
                .setThumbnail(guild.iconURL({extension: 'webp', size: 256}))
                .setColor('DarkRed')
            ],
            ephemeral: true
        })
    };

    const joined = customId.includes('join') ? true : false;

    const channel = await client.channels.fetch(channels.events);

    let thread = await channel.threads.fetch(eventData.thread_id);
    if (!thread) thread = await channel.threads.fetch(eventData.thread_id, {force: true});

    try {
        await thread.members.fetch();
        const inThread = thread.members.cache.has(member.id);

        if (joined && inThread) return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('Hummm...')
                .setDescription(
                    joined ? 
                    `T'as déjà signalé étant participant à l'event...` :
                    `T'as déjà dis ne pas être là, c'est bon pas besoin d'insister\n-# *Toccard*`
                )
                .setColor('DarkBlue')
                .setThumbnail('https://resist-1933-1945.eu/resist_content/_processed_/8/f/csm_Portrait_DeGaulle_neu_eb41e6a686.jpg')
            ],
            ephemeral: true
        });

        if (joined && !inThread) {
            await thread.send(`<@${member.id}> s'est signalé comme participant à __${eventData.title}__`);
        } else if (!joined && inThread) {
            await thread.send(`${member.displayName || member.nickname} ne participes plus à __${eventData.title}__`);
            await thread.members.remove(member.id);
        }
    
        await executeStatement(
            "INSERT OR REPLACE INTO event_participants (event_id, user_id, updated, participating)" + 
            "VALUES (?, ?, ?, ?)", [
                eventId, member.id, (new Date()).getTime(), joined ? 1 : 0
            ]
        );

        const row = await generateButtons(eventId, true);
    
        let message = await channel.messages.fetch(eventData.message_id);
        if (!message) message = await channel.messages.fetch(eventData.message_id, {force: true});
    
        message.edit({
            embeds: message.embeds,
            components: [row]
        })
        .catch(r => logger.error('Unable to update message', r));

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('Votre présence a été mis à jour !')
                .setDescription(
                    joined ? 
                    `Vous pouvez discutez au sujet de l\'évènement ici <#${eventData.thread_id}>.` :
                    `Vous avez été retiré de l'évènement et du fil de discussion.`
                )
                .setColor('DarkBlue')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'webp', size: 128 }))
            ],
            ephemeral: true
        });
    } catch (err) {
        logger.error('Unable to update a users status for eventID', eventId, err);
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('Une erreure est survenu')
                .setDescription(
                    'Merci de le signaler au développeur\n' +
                    '```ansi\n' +
                    `[0;31m${err.message}\n` +
                    '```'
                )
                .setColor('DarkRed')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'webp', size: 128 }))
            ],
            ephemeral: true
        });
    }
};

const initEvents = async (client) => {
    const channel = await client.channels.fetch(channels.events);

    Object.keys(currentEvents).forEach(async (id) => {
        const eventData = currentEvents[id];

        const row = await generateButtons(id, true);

        let message = await channel.messages.fetch({limit: 2, message: eventData.message_id});
        if (!message) message = await channel.messages.fetch(eventData.message_id, {force: true});

        if (message) message.edit({
            embeds: message.embeds,
            components: [row]
        })
        .catch(r => logger.error('Unable to update message', r));
    });
}

module.exports = { addNewEvent, handleEventParticipation, initEvents }