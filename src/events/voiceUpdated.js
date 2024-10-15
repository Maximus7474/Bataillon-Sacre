const Discord = require("discord.js")

const { channels, text } = require('../config.json');

const log = new require('../utils/logger.js')
const logger = new log("Voice State")

module.exports = {
    event: 'voiceStateUpdate',
    type: "on",
    async call(client, oldState, newState) {

        if (channels.voiceCreate === null) return;

        if (oldState.channelId === newState.channelId) return;

        if (!client.runtimeTemporaryData.temporaryVoiceChannels) client.runtimeTemporaryData.temporaryVoiceChannels = [];

        if (newState.channelId === channels.voiceCreate || channels.voiceCreate.includes(toString(newState.channelId))) {
            let newChannel
            try {
                newChannel = await newState.channel.clone({
                    name: text.voiceCreate.replace(/channel_name/g, newState.member.displayName)
                });
                
                await newState.member.voice.setChannel(newChannel);

                client.runtimeTemporaryData.temporaryVoiceChannels.push(newChannel.id)
            } catch (error) {
                logger.error('Error cloning channel:', error);
            }
        }
        if (oldState.channelId && (client.runtimeTemporaryData.temporaryVoiceChannels).includes(oldState.channelId)) {
            setTimeout(() => {
                if (oldState.channel.members.size !== undefined && oldState.channel.members.size !== 0) return;
    
                logger.info(`Deleting voice channel: \`${oldState.channel.name}\` with id \`${oldState.channel.id}\`.`)
    
                if (oldState.channel === null || oldState.channel === undefined) return;
    
                oldState.channel.delete('Empty Temp Channel')
                    .then(() => {
                        // logger.info('Successfully deleted channel')
                    })
                    .catch(err => {
                        logger.error('Unable to delete channel:', err);
                    });
            }, 50);
        }
    }
}