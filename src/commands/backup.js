const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    /* Set to true if it should only be available to guilds specified in the .env */
    guildOnly: false,
    register_command: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Faire une backup'),
    async execute(client, interaction) {
        const { user } = interaction;


        if (user.id !== '336592756698906626') {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Pas pour toi')
                    .setColor('Red')
                    .setImage('https://media1.tenor.com/m/B3H88xsT2BsAAAAd/shannon-sharpe-undisputed.gif')
                ],
                ephemeral: true
            });
        }

        const filePath = path.join(__dirname, '../../data.db');
        
        if (fs.existsSync(filePath)) {
            try {
                await user.send({
                    content: 'Here is the data.db file you requested!',
                    files: [{
                        attachment: filePath,
                        name: 'data.db'
                    }]
                });

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Backup Sent')
                    ],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error sending the file:', error);

                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Backup')
                        .setDescription(`Impossible to send the file.\nError: \`${error.message}\``)
                    ],
                    ephemeral: true
                });
            }
        } else {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Backup')
                    .setDescription('The database file doesn\'t exist.')
                ],
                ephemeral: true
            });
        }
    }
}