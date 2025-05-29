const { GetInteractionHandlersForStaticMessages } = require('../utils/initialisation/setup_staticMessages');
const { handleEventParticipation } = require('./custom/game_event_handler');
const { checkSignupInteractionID, handleSignupResponse } = require('./custom/signup_handler');

const log = new require('../utils/logger.js');
const logger = new log("Interaction Handler");

const callbacks = GetInteractionHandlersForStaticMessages();

module.exports = async (client,interaction) => {
    const { customId } = interaction;

    if (customId.startsWith('collector')) return;

    if (customId.startsWith('event_participation')) return handleEventParticipation(client, interaction);

    if (typeof callbacks[customId] === 'function') {
        logger.info('Running callbacks', customId);
        
        return await callbacks[customId](client, interaction);
    }

    if (checkSignupInteractionID(customId)) return handleSignupResponse(client, interaction);

    logger.warn('Unable to handle an interaction:', customId);
};