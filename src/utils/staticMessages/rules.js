const { EmbedBuilder } = require('discord.js');
const log = new require('../logger.js')
const logger = new log("MessageRules")

const { channels, colors } = require('../../config.json');

function createRulesEmbedWithButton() {
    const embed = new EmbedBuilder()
        .setTitle('Règlement du Bataillon Sacré')
        .setDescription('Veuillez bien prendre connaissances du règlement et réagir au message pour l\'accepter.')
        .setColor(colors.admin)
        .setFields(
            {
                name: "<a:fleche:834376849382572082> Principes",
                value: `>>> Soyez toujours respectueux envers les autres. Rien ne justifiera la moquerie ou l'insulte.
                Always be respectful with others. Nothing will justify mockery or insult.`,
                inline: false
            },
            {
                name: "<a:fleche:834376849382572082> Canaux",
                value: `>>> Utilisez les bons canaux et faites un minimum attention à l'orthographe. Gardez le contenu pour adulte en dehors de ce serveur.
                Use the right channels and pay attention to spelling. Keep adult content off this server.`,
                inline: false
            },
            {
                name: "<a:fleche:834376849382572082> Promotions",
                value: `>>> Veuillez demander au **Staff** avant de procéder à la promotion de serveurs, chaines, groupes ou autre (même en privé).
                Please ask the **Staff** before proceding with promotions of otherservers, chanels, groups or anything else (even in private).`,
                inline: false
            },
            {
                name: "<a:fleche:834376849382572082> Signalement",
                value: `>>> Pour signaler des propos déplacés ou du contenu interdit, n'hésitez pas à les mentionner ou de les contacter en privé. Il est préfferable de contacter avec courtoisie la personne concernée pour évoquer le problème en privée en cas de litige.
                To report inappropriate comments or prohibited content, do not hesitate to mention the staff or to contact them by private message. However it is prefered to discuss with the concerned person about the issue in the event of a dispute.`,
                inline: false
            },
            {
                name: "<a:fleche:834376849382572082> Respect",
                value: `>>> Ne visez pas directement un membre de manière injurieuse ou insultante. Ne provoquez pas, ne trichez pas et ne trollez pas. Toute dispute pourra être effacée du chat par le **Staff** et les auteurs des messages seront sanctioné.
                Do not target a member in a abusive or insulting manner. Don't provoke, cheat or troll. Any dispute can be removed by the **Staff** and the authors of the messages will be penalized.`,
                inline: false
            },
            {
                name: "<a:fleche:834376849382572082> Contenu interdit",
                value: `>>> Tout message à charactère discriminant, insultant ou présentant du contenu illégal, insultant, pornographique, raciste ou visant à dénigrer une croyance se vera supprimé. L'auteur du message se vera sanctionné en fonction de la gravité de l'infraction.
                Any message that discriminates, insultes or contains illegal, insulting, pornographic, racist or denigrating a belief will be removed. And the author will be penalized in function of the gravity of the offence`,
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