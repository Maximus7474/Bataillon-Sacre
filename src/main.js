const { Client, GatewayIntentBits, Partials, Events } = require('discord.js')
require('dotenv').config()
const assert = require('assert')

const setup_commands = require('./utils/initialisation/setup_commands')
const load_events = require('./utils/initialisation/load_events')
const { InitializeStaticMessages } = require('./utils/initialisation/setup_staticMessages')

const { initializeDatabase } = require('./utils/database/sqliteHandler')

const { compareAndUpdateConfigFiles } = require('./utils/checkConfig');
const { InitEvents } = require('./handlers/custom/game_event_handler')

assert(process.env.TOKEN, "A Discord Token for your bot is required ! Please go to your application page to get it! Set your token then as an enviormental variable with the TOKEN variable name!")

compareAndUpdateConfigFiles();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
    ]
});

initializeDatabase();

setup_commands(client);
load_events(client);

client.login(process.env.TOKEN);

client.once(Events.ClientReady, (client)=>{
    InitializeStaticMessages(client);
    console.log('InitEvents called');
    InitEvents(client);
});