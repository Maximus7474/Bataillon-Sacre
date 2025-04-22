const { EmbedBuilder } = require('discord.js');
const log = new require('../logger.js')
const logger = new log("MessageRules")

const { channels, colors } = require('../../config.json');

function createRulesEmbedWithButton() {
    const embed = new EmbedBuilder()
        .setTitle('📜 Règlement du serveur Discord du Bataillon sacré.')
        .setDescription(
            `> Merci de respecter règlement ci-dessous.\n\n` +
            `- *PS : Pour rappel, vous l'avez déjà accepté au préalable en rejoignant notre serveur*.`
        )
        .setColor(colors.admin)
        .setFields(
            {
                name: ":compass: Principes généraux : ",
                value: `- Restez respectueux en toutes circonstances. Aucune forme de moquerie, d’insulte ou de harcèlement ne sera tolérée.\n`+
                        `- L’objectif est de créer un espace sain, inclusif et bienveillant pour tous les membres.`,
                inline: false
            },
            {
                name: ":speech_balloon: Utilisation des canaux :",
                value: `- Postez vos messages dans les bons salons selon leur thème.\n`+
                        `- Évitez le flood, le spam ou les messages hors-sujet.\n`+
                        `- Soignez un minimum votre orthographe pour rester lisible et compréhensible par tous.\n`+
                        `- Évitez le langage SMS autant que possible.\n`,
                inline: false
            },
            {
                name: ":underage: Contenus : ",
                value: `- Aucun contenu adulte, choquant n’est autorisé en dehors du canal NSFW, quel que soit le salon.\n`+
                        `- Les discussions sensibles (politique, religion, etc.) doivent rester mesurées et respectueuses.\n`+
                        `- Les propos racistes, sexistes, homophobes, transphobes ou discriminatoires sont strictement interdits.`,
                inline: false
            },
            {
                name: ":no_entry_sign: Comportements interdits :",
                value: `- Ne provoquez pas, ne trichez pas, ne trollez pas.\n`+
                        `- Le harcèlement, même en messages privés, peut entraîner une sanction sur le serveur.\n`+
                        `- Ne publiez pas d'informations personnelles (les vôtres ou celles d'autrui).`,
                inline: false
            },
            {
                name: ":shield: Respect et signalements :",
                value: `- En cas de problème, mentionnez ou contactez un membre du staff en message privé.\n`+
                        `- Il est conseillé d’essayer une approche cordiale avec la personne concernée avant de faire appel au staff (dans la mesure du possible).\n`+
                        `- Toute dispute publique pourra être effacée par la modération.`,
                inline: false
            },
            {
                name: ":loudspeaker: Promotions et publicité :",
                value: `- La publicité pour des serveurs, chaînes, groupes ou autres plateformes est interdite sans l’autorisation préalable du staff. Cela vaut aussi pour les messages privés aux membres du serveur.`,
                inline: false
            },
            {
                name: ":closed_lock_with_key: Pseudonymes et avatars :",
                value: `- Les pseudos et les photos de profil doivent rester respectueux et appropriés.\n`+
                        `- Tout nom offensant ou inapproprié pourra être modifié ou sanctionné.`,
                inline: false
            },
            {
                name: ":scales: Sanctions :",
                value: `- Le staff se réserve le droit de supprimer tout contenu inapproprié, de sanctionner tout comportement déplacé, voire de bannir un membre selon la gravité des faits.\n`+
                        `- Les sanctions peuvent aller d’un simple avertissement à un bannissement définitif, sans préavis.`,
                inline: false
            },
        )
        .setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Emblem_of_La_Francophonie.svg/1034px-Emblem_of_La_Francophonie.svg.png");

    return embed;
}

module.exports = {
    /* Can also by a simple string */
    customId: [],
    /* Setup function that is run on client start */
    async setup (client) {
        try {
            const channelId = channels.rules;
            if (channelId === undefined || channelId === null) {
                return
            }
            const channel = client.channels.cache.get(channelId);
    
            if (!channel) return logger.warn('No Channel Specified for Rules.');
    
            const messages = await channel.messages.fetch({ limit: 5 });
            const clientMessage = messages.find(msg => msg.author.id === channel.client.user.id);
    
            const embed = createRulesEmbedWithButton();
            if (!clientMessage) {
                await channel.send({ embeds: [embed] });
            } else {
                await clientMessage.edit({ embeds: [embed] });
            }
        } catch (error) {
            logger.error(`checkLastRulesMessage(${channels.rules})`,"Caught Error:", error);
        }
    },
    /* The function called for any interactions created using the specified customId */
    async callback (client, interaction) {}
}