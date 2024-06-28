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
            if (oldState.channel.members.length !== undefined) return;
            try {
                logger.info("Deleting empty voice channel", oldState.channel.name, oldState.channel.members.length, oldState.channel.delete)
                oldState.channel.delete('Empty Temp Channel');
            } catch (err) {
                logger.error('Error deleting channel:', err);
            }
        }
    }
}