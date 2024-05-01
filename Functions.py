import discord, datetime, json, pytz

from Types import *
from typing import *

def update_data() -> dict:
    with open("BDD.json", "r") as json_file:
        return json.load(json_file)

baseline_data = update_data()

def debugprint(*args):
    print("[\033[4m\033[95mDEBUG\033[0m]", args)

def current_time(
    unix_format:bool=False,
    part_of_day:bool=False
) -> Union[datetime.datetime, str, int]:
    utc_now = datetime.datetime.now(pytz.utc)
    cet_timezone = pytz.timezone('Europe/Paris')
    cet_now = utc_now.astimezone(cet_timezone)
    
    if part_of_day :
        if cet_now.hour < 4 or cet_now.hour > 21:
            return "nuit"
        elif cet_now.hour < 12:
            return "matinée"
        elif cet_now.hour < 18:
            return "après-midi"
        else:
            return "soirée"
        
    if unix_format:
        return round(cet_now.timestamp())
    
    return cet_now

def isFirstLetter(string:str) -> bool:
    if string[0].isalpha():
        try:
            int(string[0])
        except ValueError:
            if string[0] != " ":
                return True
            else:
                return False
        else:
            return False
    else:
        return False

def createUserDBEntry(member: discord.Member = None) -> UserDBEntry:
    if member is None: return {}
    return {
        "pseudo": member.name,
        "joined": round(member.joined_at.timestamp()),
        "PM-State": True,
        "left": []
    }

async def logger(channels:discord.TextChannel, command_name:str, user:discord.User, arguments:list) -> NoReturn:
    for channel in channels:
        await channel.send(embed=discord.Embed(
            title = "Command Logger: {}".format(command_name),
            description = "Command executed by:\n- Mention {}\n- Name: {}\n- ID: {}\nDetails:\n>>> {}".format(
                user.mention,
                user.name,
                str(user.id),
                "\n".join(arguments),
            ),
            color = baseline_data["General Data"]["Colors"]["Normal"]
            ).set_thumbnail(url = user.avatar.url)
        )

async def transferMessage(message: discord.Message, destination: destinationChannels) -> NoReturn:
    embed = discord.Embed(
        title=f"Message de: {message.author.name}" if not message.author.bot else f"Bot: {message.author.name}#{message.author.discriminator}",
        description=message.content,
        color=0x313338,
        timestamp=message.created_at,
        url=f"http://discord.com/users/{message.author.id}" if isinstance(message.channel, discord.DMChannel) else message.channel.jump_url
    )
    
    embed.set_author(
        name=message.author.display_name, icon_url=message.author.display_avatar.url
    )
    
    files = []
    if message.attachments != []:
        for attachment in message.attachments:
            files.append(attachment.to_file(
                    use_cached=True,
                    description=f"Envoyé par {message.author.name} ({message.author.id}) le {message.created_at.strftime('%d/%m/%Y, %H:%M:%S')}"
                )
            )
    
    destination = [destination] if not isinstance(destination, list) else destination
    
    for channel in destination:
        await channel.send(
            embed=embed,
            files=files if len(files) > 0 else None
        )

async def logger(
    client: discord.Client,
    interaction:discord.Interaction,
    function:str,
    content:str
):
    embed = discord.Embed(
        title=f"Command Log: __{function}__",
        description=content,
        timestamp=current_time(),
    )
    embed.add_field(name="Command Environement:",value=f"- Guild: {interaction.guild.name}\n- Channel: <#{interaction.channel_id}>\n- Author:\n  - Display Name: {interaction.user.display_name} - {interaction.user.mention}\n  - Roles: {', '.join([r.mention for r in interaction.user.roles[1:-1]])}")
    embed.set_author(
        name=interaction.user.name,icon_url=interaction.user.avatar.url,url=f"https://discord.com/channels/@me/{interaction.user.id}"
    )
    
    for channel_id in client.general_data["Settings"]["Setup"]["Logging Channel"]:
        
        channel = client.get_channel(channel_id)
        
        if interaction.guild_id != 972864191226605648 or channel.guild.id == interaction.guild_id:
            await channel.send(embed=embed)
