const fs = require('fs');
const path = require('path');
const { ActivityType } = require('discord.js');

const { channels, text } = require('../config.json');

const log = new require('../utils/logger.js');
const logger = new log("Voice State");

let storageFile = path.join(__dirname, '../temporaryVoiceChannels.json')
let temporaryVoiceChannels = [];

if (fs.existsSync(storageFile)) {
    try {
        const data = fs.readFileSync(storageFile, 'utf-8');
        temporaryVoiceChannels = JSON.parse(data);
        logger.success('Temporary voice channels loaded:', temporaryVoiceChannels);
    } catch (err) {
        logger.error('Error loading temporary voice channels:', err.message);
    }
} else {
    logger.info('Storage file not found. Starting with an empty list.');
}

const saveTemporaryData = () => {
    try {
        fs.writeFileSync(storageFile, JSON.stringify(temporaryVoiceChannels, null, 2), 'utf-8');
        logger.success('Temporary voice channels saved.');
    } catch (err) {
        logger.error('Error saving temporary voice channels:', err);
    }
};

const removeChannel = (id) => {
    const index = temporaryVoiceChannels.indexOf(id);
    if (index !== -1) {
        temporaryVoiceChannels.splice(index, 1);
        saveTemporaryData();
    } else {
        logger.warn(`Value ${id} not found in temporaryVoiceChannels.`);
    }
};

module.exports = {
    event: 'voiceStateUpdate',
    type: "on",
    async call(client, oldState, newState) {

        if (channels.voiceCreate === null) return;

        if (oldState.channelId === newState.channelId) return;

        if (!temporaryVoiceChannels) temporaryVoiceChannels = [];

        if (newState.channelId === channels.voiceCreate || channels.voiceCreate.includes(toString(newState.channelId))) {
            let newChannelName

            const { activities } = newState.member.presence;
            activities.filter(act => (
                act.type === ActivityType.Playing ||
                act.type === ActivityType.Streaming ||
                act.type === ActivityType.Competing
            ));

            if (activities.length > 0) {
                const activity = activities[0];
                newChannelName = activity?.name;
            }
            
            if (!newChannelName){
                newChannelName = newState.member.displayName;
            }

            try {
                const newChannel = await newState.channel.clone({
                    name: text.voiceCreate.replace(/channel_name/g, newChannelName)
                });
                
                await newState.member.voice.setChannel(newChannel);

                temporaryVoiceChannels.push(newChannel.id);
                saveTemporaryData();
            } catch (error) {
                logger.error('Error cloning channel:', error);
            }
        }
        if (oldState.channelId && (temporaryVoiceChannels).includes(oldState.channelId)) {
            setTimeout(() => {
                if (oldState.channel.members.size !== undefined && oldState.channel.members.size !== 0) return;
    
                logger.info(`Deleting voice channel: \`${oldState.channel.name}\` with id \`${oldState.channel.id}\`.`)
    
                if (oldState.channel === null || oldState.channel === undefined) return;

                const { channel } = oldState;
    
                oldState.channel.delete('Empty Temporary Channel')
                    .then(() => {
                        logger.info('Successfully deleted channel', channel.name, channel.id);
                        removeChannel(channel.id);
                    })
                    .catch(err => {
                        logger.error('Unable to delete channel:', err);
                    });
            }, 50);
        }
    }
}