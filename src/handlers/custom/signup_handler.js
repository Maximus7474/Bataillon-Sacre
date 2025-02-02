const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");

const { roles } = require('../../config.json');

const checkSignupInteractionID = (customId) => {
    const regex = /^(accept_signup|reject_response)_[0-9]{17,19}$/;
    return regex.test(customId);
};

const handleSignupResponse = async (client, interaction) => {
    const regex = /^(accept_signup|reject_response)_([0-9]{17,19})$/;
    const match = interaction.customId.match(regex);

    if (!match) {
        return interaction.reply({ content: "Invalid interaction ID.", ephemeral: true });
    }

    const action = match[1];
    const userId = match[2];
    const guild = interaction.guild;
    
    if (!guild) {
        return interaction.reply({ content: "This command must be used in a server.", ephemeral: true });
    }

    try {
        const member = await guild.members.fetch(userId);
        const moderator = interaction.user;
        const timestamp = (new Date()).toLocaleDateString('fr');

        // Notify the user about the outcome
        const messageContent = action === "accept_signup" 
            ? `Votre inscription a été validée, bienvenu !`
            : `Votre inscription a été rejetée. Si vous avez des questions, veuillez contacter les modérateurs.`;

        let informed = true;
        try {
            await member.send(messageContent);
        } catch {
            informed = false;
        }

        for (const roleId of roles.validatedRules) {
            const role = guild.roles.cache.get(roleId);
            if (role) {
                await member.roles.add(role);
            }
        }

        const message = await interaction.message.fetch();

        const updatedEmbed = EmbedBuilder.from(message.embeds[0])
            .setColor(action === "accept_signup" ? "Green" : "Red")
            .addFields({
                name: `Membre informé:`, value: informed ? "> :white_check_mark: Oui" : "> :x: Non", inline: false
            })
            .setFooter({ text: `Validé par ${moderator.tag} | ${timestamp}`, iconURL: moderator.displayAvatarURL() });

        const disabledButtons = message.components.map(row => 
            ActionRowBuilder.from(row).setComponents(
                row.components.map(button => 
                    ButtonBuilder.from(button).setDisabled(true)
                )
            )
        );

        await interaction.update({ embeds: [updatedEmbed], components: disabledButtons });

    } catch (error) {
        console.error("Error fetching member or updating message:", error);
        return interaction.reply({ content: "An error occurred while processing the request.", ephemeral: true });
    }
};

module.exports = { checkSignupInteractionID, handleSignupResponse }