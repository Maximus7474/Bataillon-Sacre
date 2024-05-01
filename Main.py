# v2.0.0

import discord
import datetime
import re,asyncio,os,traceback
import random as R
import json
import Functions

from discord import Intents, app_commands
from discord.ext import tasks,commands
from discord.app_commands import Choice
from dotenv import load_dotenv
from Functions import debugprint, logger

load_dotenv()
TOKEN = os.getenv("TOKEN")

client = discord.Client(intents=Intents.all())
tree = app_commands.CommandTree(client)
client.general_data = {}
client.temporary_channels = []

client.DemoMode = True

####################################################################################### TREE SETUP

@tree.error
async def error_handler(interaction:discord.Interaction,error:app_commands.AppCommandError=None):

    print("[\033[91mERROR\033[0m] Command Error author:",interaction.user.name,"error:",str(error))

    if isinstance(error,discord.app_commands.errors.MissingRole):
        embed=discord.Embed(
                title="Erreure",
                description="Il te manque un rôle pour accéder à cette commande.\nIl te faut le rôle suivant: <@&{}>".format(str(error).split(' ')[1]),
                color=client.general_data["Settings"]["Colors"]["Error"]
            )
    elif isinstance(error,discord.app_commands.errors.MissingAnyRole):
        embed=discord.Embed(
                title="Erreure",
                description="Il te manque des rôles pour accéder à cette commande.\nIl te faut un des rôles suivant: {}".format(
                    ", ".join([f"<@&{text[1:-1]}>" for text in str(error).split(" required roles: ")[1].split(" or ")])
                ),
                color=client.general_data["Settings"]["Colors"]["Error"]
            )
    elif isinstance(error,discord.app_commands.errors.MissingPermissions):
        embed=discord.Embed(
                title="Erreure",
                description="Il te manque la permission {} pour accéder à cette commande.".format(str(error).split("missing ")[1].split('permission')[0]),
                color=client.general_data["Settings"]["Colors"]["Error"]
            )
    elif isinstance(error,discord.app_commands.errors.CommandNotFound):
        embed=discord.Embed(
                title="Erreure",
                description="Cette Commande existe pas.",
                color=client.general_data["Settings"]["Colors"]["Error"]
            )
        await client.get_channel(1073152868967780393).send(
            embed=discord.Embed(
                title="Command not Found Error",
                description=f"Error Text:\n>>> {error}",
                color=client.general_data["Settings"]["Colors"]["Error"]
            )
        )
    else:
        embed=discord.Embed(
                title="Erreure",
                description="Une erreure est survenu, un report a été envoyé.\n```py\n{}\n```".format(type(error)),
                color=client.general_data["Settings"]["Colors"]["Error"]
            )
        await client.get_channel(1092415181117730846).send(
            content="<@336592756698906626>",
            embed=discord.Embed(
                title="Uncaught Interaction Error",
                description=f"Error Text:\n>>> {error}\n**Uncaught Error Type**: ```py\n{type(error)}\n```",
                color=client.general_data["Settings"]["Colors"]["Error"]
            ).add_field(
                name="Author",
                value=f"Name: `{interaction.user.name}`\nDisplay Name: `{interaction.user.display_name}`\nID: `{interaction.user.id}`",
                inline=True
            ).add_field(
                name="Data:",
                value=f"```py\n{interaction.data}\n```",
                inline=False
            )
        )
    try:
        await interaction.response.send_message(
            embed=embed,ephemeral=True
        )
    except discord.errors.HTTPException:
        pass

####################################################################################### DEFINITIONS

def backup_data(read:bool=False):
    if read :
        with open("BDD.json", "r") as json_file:
            client.general_data = json.load(json_file)
    else :
        with open("BDD.json", "w") as json_file:
            json.dump(client.general_data, json_file, indent=4)
            
backup_data(read=True)

async def errorReport(function,message):
    embed = discord.Embed(
        title=f"Erreure fonction: {function}",
        description=message,
        color=client.general_data["Settings"]["Colors"]["Error"]
    )
    
    embed.set_thumbnail(url=client.user.avatar.url)
    
    print("[\033[91mERROR\033[0m]",message)
    
    channel = client.get_channel(1092415181117730846)
    await channel.send(embed=embed)

async def commandResponses(
    interaction:discord.Interaction=None,
    title:str=None,
    description:str=None,
    color:int=client.general_data['Settings']['Colors']['Normal'],
    footer:str=None,
    fields:list=None,
    ephemeral:bool=True,
    file:discord.File=None
):
    if interaction is None:
        await errorReport("commandResponses","interaction or embedData not defined")
        return
    embed = discord.Embed(
        title=title,
        description=description,
        color=color,
        timestamp=Functions.current_time()
    )
    if fields is not None:
        for field in fields:
            embed.add_field(name=field['name'],value=field['value'])
    if footer is not None:
        embed.set_footer(text=footer)
    
    embed.set_thumbnail(url=client.user.avatar.url)
    
    if file is not None:
        await interaction.response.send_message(embed=embed,ephemeral=ephemeral,file=file)
    else:
        await interaction.response.send_message(embed=embed,ephemeral=ephemeral)

class patchNoteModal(discord.ui.Modal):
    def __init__(self):
        super().__init__(title='Send Patchnote',timeout=None)
    
    text = discord.ui.TextInput(
        label='Patchnote contents:',
        placeholder="v0.0.0\nChanges:\n```diff\n+ New Feature / Fix\n- Removed function\n```",
        default="",
        style=discord.TextStyle.paragraph,
        required=True,
        max_length=3000
    )
    
    async def on_submit(self, interaction: discord.Interaction):
        
        msg_content = interaction.data["components"][0]["components"][0]['value']
        
        await commandResponses(
            interaction=interaction,
            title="Patch Note Sent",
            description=msg_content,
            color=client.general_data["Settings"]["Colors"]["Success"]
        )
        
        await logger(
            channels=[client.get_channel(channel_id) for channel_id in client.general_data["Settings"]["Channels"]["logs"]],
            command_name="SendPatchnote",
            user=interaction.user,
            arguments=[msg_content]
        )
        
        channel = client.get_channel(
            client.general_data["Settings"]["Channels"]["patchnote"]
        )
        
        if channel is None:
            guild = client.ActifGuild
            channel = guild.get_member(client.general_data["Settings"]["Channels"]["patchnote"]) if guild.get_member(client.general_data["Settings"]["Channels"]["patchnote"]) is not None else guild.owner
        
        await channel.send(
            embed=discord.Embed(
                title="Patchnote: {}".format(Functions.current_time(string_format=True)),
                description=msg_content,
                timestamp=Functions.current_time()
            )
        )

    async def on_error(self, interaction: discord.Interaction, error: Exception) -> None:

        await errorReport(
            function="Patchnote Editor",
            message=f"Error: {type(error)}\nContenu: {error}\nTraceback: ```fix\n{error.__traceback__}\n```"
        )
        
        await commandResponses(
            interaction=interaction,
            title="Une erreure c'est produite",
            description="Un report a été envoyé",
            color=client.general_data["Settings"]["Colors"]["Error"]
        )
        
        traceback.print_exception(type(error), error, error.__traceback__)
    
    async def on_timeout(self, interaction:discord.Interaction):
        print("Timed out:",self,interaction.user)

####################################################################################### EVENTS

@client.event
async def on_ready():
    backup_data(read=True)
    
    tree.clear_commands(guild=None,type=discord.AppCommandType.chat_input)
    print(f"[\033[96mLoading Commands\033[0m]")
    for command in [
            "Dev Commands", _testingCommand, id_emoji, _reply, _patchnote, _latence,
            "Admin Commands", _annonce_, _botReply,
            "Public Commands", _messagestatus
        ]:
        if isinstance(command, str) and " " in command:
            print(f"-> [\033[94m{command}\033[0m]")
            continue
        try :
            tree.add_command(command)
            print("\033[92mAdded\033[0m:",command.name,"{}[\033[92mSuccess\033[0m]".format(" "*(25 - len(command.name))))
        except app_commands.CommandAlreadyRegistered :
            print("\033[91mFailed\033[0m",command.name)
            pass
        except TypeError:
            print("[\033[91mDEACTIVATED\033[0m]",command)
            pass
    await tree.sync()
    print(f"[\033[96mFinished\033[0m]")
    
    print('\033[92mBooted up as {0.user}\033[0m'.format(client), Functions.current_time(), sep="\n")
    
    await asyncio.sleep(1)

    guild = client.get_guild(client.general_data["Settings"]["Guild"])
    if guild is not None:
        pass
    
    client.ActifGuild = guild
    client.DM_activity = False
    
    try:
        _data_save.start()
    except RuntimeError:
        _data_save.restart()

    print(
        "---------------------------------------------------------------------------------------------------------------------------",
        "- Current Discord Servers",
        "\n".join([
            f"{guild.name} ({guild.id}) - Owner: {guild.owner.name} ({guild.owner_id}) - Members: {guild.member_count} - Created: {guild.created_at.strftime('%m/%d/%Y, %H:%M:%S')}"
            for guild in client.guilds
        ]),
        "---------------------------------------------------------------------------------------------------------------------------",
        sep="\n"
    )
    if True == False and guild is not None: # Get Actif Server Data
        with open("guildData.txt", "w") as f:
            f.write("Roles:\n")
            for role in guild.roles:
                role_info = f"   - {role.name.ljust(30)} ({str(role.id).ljust(20)}) - members: {str(len(role.members)).ljust(3)} - {role.position}\n"
                f.write(role_info)

            f.write("Members:\n")
            for member in guild.members:
                roles_str = ', '.join([role.name for role in member.roles])
                member_info = f"   - {member.name.ljust(30)} / {member.display_name.ljust(30)} ( {str(member.id).ljust(19)}) - IsBot: {str(member.bot).ljust(5)} - Roles: {roles_str}\n"
                f.write(member_info)

            f.write("Channels:\n")
            for channel in guild.channels:
                try:
                    channel_info = f"   - {channel.name.ljust(20)} ({channel.id})\n"
                    f.write(channel_info)
                except UnicodeEncodeError:
                    print(channel.name)
            f.write(f"Invites:\n")
            for invite in await guild.invites():
                f.write(f"   - {(invite.url).ljust(30)} - {str(invite.uses).ljust(5)} - {invite.inviter.name.ljust(30)}")

@client.event
async def on_message(message):
    if message.author == client.user: return
        
    if isinstance(message.channel, discord.DMChannel):
        await Functions.transferMessage(message=message, destination=[client.get_channel(id) for id in client.general_data["Settings"]["Channels"]["DMs"]])
    
    elif not isinstance(message.channel, discord.DMChannel):
        if "couscous" in message.content :
            if R.randint(1,1000)==1:
                await message.reply("https://tenor.com/view/god-pray-jesus-christ-sign-of-the-cross-gif-5701179")
            else :
                couscous = ["https://tenor.com/view/maroc-morocco-kabour-talking-gif-16116853","https://tenor.com/view/couscous-saupiquet-le-bon-couscous-qui-nous-plait-plait-gif-23018256"]
                await message.reply(R.choice(couscous),mention_author=False)
        elif "iWeester" in message.content :
            await message.reply("https://tenor.com/view/perun-perkun-zeus-thor-god-gif-22223879",mention_author=False)

@client.event
async def on_member_update(before, after):
    pass

@client.event
async def on_raw_reaction_add(payload):
    if payload.message_id == client.general_data["Settings"]["Messages"]["Rules"] and payload.emoji.name == "✅" :
        member = payload.member
        
        await member.add_roles(*[client.actifGuild.get_role(id) for id in [client.general_data["Settings"]["Roles"]["Visiteur"], client.general_data["Settings"]["Roles"]["MultiGaming"]]])

        await member.remove_roles(client.actifGuild.get_role(client.general_data["Settings"]["Roles"]["Visiteur"]))

        await member.send("Règlement accepté, vous avez maintenant accès à notre espace visiteur.")

@client.event
async def on_raw_reaction_remove(payload):
    if payload.message_id == client.general_data["Settings"]["Messages"]["Rules"] and payload.emoji.name == "✅" :
        member = payload.member
        
        await member.remove_roles(*[client.actifGuild.get_role(id) for id in [client.general_data["Settings"]["Roles"]["Visiteur"], client.general_data["Settings"]["Roles"]["MultiGaming"]]])

        await member.add_roles(client.actifGuild.get_role(client.general_data["Settings"]["Roles"]["Visiteur"]))
        
        await member.send("Vous n'êtes plus en accord avec le règlement, vous n'avez plus accès à notre espace visiteur.")

@client.event
async def on_member_join(member):
    if member.guild.id == client.ActifGuild.id:
        
        await client.get_channel(client.general_data["Settings"]["Channels"]["arrival"]).send(
            embed=discord.Embed(
                title = f"{member.name} a rejoint le serveur",
                description = f"ID: {member.id}\nDate de Création: <t:{round(member.created_at.timestamp())}:F>\nFlags: ",
                color = client.general_data["Settings"]["Colors"]["Normal"]
            ).set_author(
                name=member.name,
                icon_url=member.avatar.url
            )
        )
        
        try :
            client.general_data["Info Utilisateur"][str(member.id)] = Functions.createUserDBEntry(member=member)
            
            await member.add_roles(client.actifGuild.get_role(client.general_data["Settings"]["Roles"]["Visiteur"]))
            
            await member.send(
                embed=discord.Embed(
                    title="Bienvenu(e) !",
                    description="Prends connaissance du règlement et valide le pour accéder à l'espace dédié aux simples visiteurs sur notre serveur.\nPour accéder à l'espace des membres, penses à t'inscrire (les informations à ce propos sont dans le salon <#935582041578287115>).",
                    color = member.accent_color.value if hasattr(member, 'accent_color') and hasattr(member.accent_color, 'value') else client.general_data["Settings"]["Colors"]["Normal"]
                ).set_thumbnail(
                    url=client.ActifGuild.icon.url
                ).set_author(
                    name=client.ActifGuild.name
                )
            )
        
        except discord.HTTPException as e:
            await client.get_guild(689817783730700318).get_member(336592756698906626).send(
                f"Error with User join :{str(member)}\n> Error:\n```{e}```"
            )

@client.event
async def on_member_remove(member):
    if member.guild.id == client.ActifGuild.id: return
    try :
        
        roles = ", ".join([r.mention for r in member.roles])
        await client.get_channel(client.general_data["Settings"]["Channels"]["departure"]).send(
            embed=discord.Embed(
                title = f"{member.name} à quitté le serveur",
                description = f"Nom d'affichage: {member.display_name}\nJour d'arrivée: <t:{round(member.joined_at().timestamp)}:d>\nRoles:\n>>> {roles}",
                color = client.general_data["Settings"]["Colors"]["Normal"]
            ).set_author(
                name=member.name,
                icon_url=member.avatar.url
            )
        )
        
    except AttributeError:
        await client.get_channel(
            client.general_data["Settings"]["Channels"]["departure"]
        ).send(
            embed=discord.Embed(
                title = f"{member.name} à quitté le serveur",
                color = client.general_data["Settings"]["Colors"]["Normal"]
            )
        )

@client.event
async def on_member_update(before, after):
    pass

@client.event
async def on_voice_state_update(member,before,after):
    if after.channel is not None and after.channel.id in client.general_data["Settings"]["Channels"]["createvoice"] :
        if before.channel is not None and before.channel.id in client.temporary_channels and before.channel.members==[]:
            await before.channel.delete()

        if member.activity!=None :

            for i in member.activities :

                if "ActivityType.playing:" in str(i):
                    channame=str(str(i).split("name='")[1].split("'")[0])
                    channel = await after.channel.clone(name="🔊 "+channame)
                    await member.move_to(channel)
                    debugprint("(Created Channel)", member,"moved to",channame)
                    return
                    
        channame="🔊 "+member.display_name

        channel = await after.channel.clone(name=channame)
        await member.move_to(channel)
        client.temporary_channels.append(channel.id)
        return
    
    if before.channel is not None and before.channel.id in client.temporary_channels and before.channel.members==[]:#Values to change
        await before.channel.delete()
        client.temporary_channels.remove(before.channel.id)
        return


####################################################################################### TASKS

@tasks.loop(hours=12)
async def _data_save():
    channel = client.get_guild(972864191226605648).get_channel(1077977389319073922)
    count = 0
    async for message in channel.history():
        if message.author == client.user and count >= 1:
            await message.delete()
        else :
            count += 1
        await asyncio.sleep(1)
    backup_data(read=False)
    await channel.send(content="{}\nBackup : {}".format(client.user.name,str(Functions.current_time())),file=discord.File("BDD.json"))

####################################################################################### DEV COMMANDS

@tree.command(name="tester", description="Peut tout et rien faire")
@commands.is_owner()
async def _testingCommand(interaction:discord.Interaction):
    guild = interaction.guild
    member = interaction.user    
    await interaction.response.send_message(
        embed=discord.Embed(
            title = f"{member.name} a rejoint le serveur",
            description = f"ID: {member.id}\nDate de Création: <t:{round(member.created_at.timestamp())}:F>\nFlags: ",
            color = client.general_data["Settings"]["Colors"]["Normal"]
        ).set_author(
            name=member.name,
            icon_url=member.avatar.url
        )
    )

@tree.command(name="id_emoji",description="Récupéré l'id d'un émoji")
async def id_emoji(interaction:discord.Interaction,emoji:str):
    await interaction.response.send_message(f"`{str(emoji)}`")

@tree.command(name="ping",description="Latence du Bot")
async def _latence(interaction:discord.Interaction):
    await interaction.response.send_message(
        embed=discord.Embed(
            title=f'Pong! {round (client.latency * 1000)} ms',
            color=0x313338
        ).set_image(
            url=R.choice([
                "https://i.giphy.com/fvA1ieS8rEV8Y.webp",
                "https://media.tenor.com/YFxxWTSfT-AAAAAM/ping.gif",
                "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjN1bmVqc2M2bWs5NTVuNXFza3NpaHY3N2p1NzgzY3lvYzd6bjN5biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l7NCK0YAS8NneKv6Dm/giphy.gif",
                "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2xrY2xldXIwOGU1MzY0Ym4zanN0djFyMGVuN2xya2tnY294NDc3YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/K4prM9WJY5xLy/giphy.gif",
                "https://i.gifer.com/origin/f3/f3a6dd00984440fcb76e3e9ded858e6f_w200.gif",
                "https://64.media.tumblr.com/tumblr_lxo7nldVFH1qint86o1_500.gif",
                "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjZwemN2MGdvbm91MjI4MjJoajRkYWx3ZHRnaWd5bHNobXJtZ3h2NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MeIcGRt6Zzdaeh8Y9A/giphy.gif"
            ])
        )
    )

@tree.command(name="send")
@commands.is_owner()
@app_commands.describe(message_or_channel="Message URL or Channel ID",text="Message Content")
async def _reply(interaction:discord.Interaction,message_or_channel:str,text:str):
    try:
        message_or_channel = int(message_or_channel)
    except ValueError:
        pass
    if isinstance(message_or_channel,int):
        channel = client.get_channel(message_or_channel)
        await channel.send(text)
    else:
        channel = client.get_channel(int(message_or_channel.split("/")[-2]))
        message = await channel.fetch_message(int(message_or_channel.split("/")[-1]))
        await message.reply(text)
    await interaction.response.send_message(content="Done",ephemeral=True)

@tree.command(name="patchnote")
@commands.is_owner()
async def _patchnote(interaction:discord.Interaction):
    await interaction.response.send_modal(patchNoteModal())

####################################################################################### ADMIN COMMANDS

@tree.command(name="annonce",description="Réservé aux - ̗̀ Administrateur  ̖́- , - ̗̀ Développeur  ̖́- , - ̗̀ Fondateur  ̖́-")
@commands.has_permissions(administrator=True)
@app_commands.describe(destinataires="Membre(s) ou Rôle(s) a qui le message est destiné, veuillez espacez les mentions d'un espace",message="J'espère que t'es pas con pour nécessité une aide la dessus")
async def _annonce_(interaction:discord.Interaction,destinataires:str,message:str):
    
    if client.DM_activity:
        await interaction.response.send_message(
            embed=discord.Embed(
                title="Impossible",
                description="Un envois est déjà en cours, merci d'attendre la fin de celui-ci.",
                color=0xfffff
            ),
            ephemeral=True
        )
        return
    
    open("StaffMessages.txt","a").write(
        f"{interaction.user.display_name} ({interaction.user.id}) - \"{message}\" - {Functions.current_time().strftime('%d/%m/%Y, %H:%M:S')}"
    )

    mailees = []
    for entry in destinataires.split(" ") :
        if "<@&" in entry :
            role = interaction.guild.get_role(int(entry.replace("<@&","").replace(">","")))
            for x in role.members :
                mailees.append(x)
        else :
            mailees.append(client.get_user(int(entry.replace("<@","").replace(">",""))))

    embed=discord.Embed(
        title=f"Message Staff a envoyé à : {(len(mailees))} membres",
        description=message,
        color=0xE89E00
    )
    embed.set_author(
        name=interaction.user.display_name,
        icon_url=interaction.user.display_avatar.url
    )
    
    sent = 0
    embed.add_field(name="***__Statut de l'envoie :__***",value=f"0/{len(mailees)}")
    
    await interaction.response.send_message(embed=embed,ephemeral=False)
        
    Stats = {"recus":[],"nonrecus":[]}
    
    await client.change_presence(status=discord.Status.dnd,activity=discord.Game("0/"+str(len(mailees))))
    
    client.DM_activity = True
    
    AnnouncementEmbed = discord.Embed(
        title="__**Nouveau message venant du Bataillon sacré**__",
        description=message,
        color=0xE89E00
    )
    AnnouncementEmbed.add_field(
        name="__Concernant le Bot__",
        value="Dans le cas où vous ne voudriez plus recevoir les messages venant du bot du Bataillon sacré, merci d’utiliser la commande `/message_prive` dans le channel <#822022412664045599> pour mettre à jour votre préférence."
    )
    AnnouncementEmbed.set_author(
        name=interaction.user.display_name,
        icon_url=interaction.user.display_avatar.url
    )
    AnnouncementEmbed.set_thumbnail(url=client.user.display_avatar.url)
    
    for mailee in mailees :
        if not str(mailee.id) in client.general_data["Info Utilisateur"] and client.general_data["Info Utilisateur"][str(mailee.id)]["PM-State"] :
            
            try :
                await mailee.send(
                    embed=AnnouncementEmbed
                )
                Stats["recus"].append(mailee.name)
            
            except discord.HTTPException :
                Stats["nonrecus"].append(mailee.display_name)
        
        else :
            Stats["nonrecus"].append(mailee.display_name)
            
        if sent%10==0 :
            await client.change_presence(
                status=discord.Status.dnd,
                activity=discord.Game(f"{sent}/{len(mailees)}")
            )
            embed.remove_field(0)
            embed.add_field(
                name="***__Statut de l'envoie :__***",
                value=f"{sent}/{len(mailees)}"
            )
            await interaction.response.edit_message(embed=embed)

        sent+=1
        
        await asyncio.sleep(0.5) 


    embed=discord.Embed(
        title="Message Staff a envoyé à : "+str(len(mailees))+" membres",
        description=message,
        color=0xE89E00
    )
    embed.set_author(
        name=interaction.user.display_name,
        icon_url=interaction.user.display_avatar.url
    )
    embed.add_field(
        name='Membres ayant reçu le message :',
        value=f"- {len(Stats['recus'])} Membres",
        inline=True
    )
    embed.add_field(
        name='Membres n\'ayant pas reçu le message :',
        value=f"- {len(Stats['nonrecus'])} Membres",
        inline=True
    )
    
    await interaction.response.edit_message.edit(embed=embed)
    await client.change_presence(status=discord.Status.online,activity=None)
    
    client.DM_activity = False

@tree.command(name="rep", description="Envoyer un message via le bot, Réservé aux - ̗̀ Administrateur  ̖́- ")
@app_commands.describe(
    destinataire="l'ID ou mention du destinataire",
    message="Message a envoyé"
)
@commands.has_permissions(administrator=True)
async def _botReply(interaction: discord.Interaction, destinataire: str, message: str):
    
    failedEmbed = discord.Embed(
        title="Erreure",
        description=f"Impossible de trouver l'utilisateur {destinataire}.\nUtilisez soit:\n- son identifiant comme {client.user.id}\n- sa mention {client.user.mention} (`{client.user.mention}`)",
        color=0xffff
    )
    
    try:
        destinataire = interaction.guild.get_member(int(destinataire))
    except ValueError:
        try:
            destinataire = interaction.guild.get_member(int(re.search(r'<([^>]*)>', destinataire)))
        except ValueError:
            await interaction.response.send_message(
                embed=failedEmbed
            )
            return
    
    if destinataire is not None and isinstance(destinataire, discord.Member):
        await destinataire.send(
            embed=discord.Embed(
                description=message
            )
        )
    else:
        await interaction.response.send_message(
            embed=failedEmbed
        )

####################################################################################### PUBLIC COMMANDS

@tree.command(name="message_prive",description="Autoriser ou non les messages du bot")
@app_commands.describe(status="Autorisé les messages")
@app_commands.choices(status=[Choice(name="Autorisé",value="Autorisé"),Choice(name="Interdire",value="Interdire")])
async def _messagestatus(interaction:discord.Interaction,status:str):
    if not str(interaction.user.id) in client.general_data["Info Utilisateur"]:
        client.general_data["Info Utilisateur"][str(interaction.user.id)] = Functions.createUserDBEntry(member=interaction.user)

    current_status = client.general_data["Info Utilisateur"][str(interaction.user.id)]["PM-State"] if str(interaction.user.id) in client.general_data["Info Utilisateur"] else False
    if status == "Autorisé" :
        
        if current_status :
            text = "Vous avez déjà autorisé la réception des messages provenant du Bot"
        
        else :
            
            client.general_data["Info Utilisateur"][str(interaction.user.id)]["PM-State"] = True
            
            text = "Vous avez accepté de recevoir des messages du "
    
    elif status == "Interdire" :
        
        if client.general_data["Info Utilisateur"][str(interaction.user.id)]["PM-State"] :
            
            client.general_data["Info Utilisateur"][str(interaction.user.id)]["PM-State"] = False
            
            text = "Votre préférence a été mis à jour vous ne recevrez plus de messages globaux du Bot"
        
        else :
            text = "Vous avez déjà signalé que vous ne voulez pas de messages du Bot"
    
    else :
        text = "Les arguments donné pour la commande sont invalide, veuillez recommencer"
    
    embed=discord.Embed(
        title=text,
        color=0xE7C400
    )
    embed.set_thumbnail( url=client.user.display_avatar.url )
    
    await interaction.response.send_message(
        embed=embed,
        ephemeral=True
    )
    
    backup_data()

#######################################################################################

client.run(TOKEN)