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

        if (!client.runtimeTemporaryData.temporaryVoiceChannels) client.runtimeTemporaryData.temporaryVoiceChannels = ["1241476825318686730"];

        if (newState.channelId === channels.voiceCreate) {
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

            oldState.channel.delete('Empty Temp Channel');
        }
    }
}