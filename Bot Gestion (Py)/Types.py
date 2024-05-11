import discord
from typing import *

destinationChannels = Union[
    List[
        Union[discord.TextChannel, discord.DMChannel]
    ],
    Union[
        discord.TextChannel,discord.DMChannel]
    ]

class UserDBEntry(Dict[str, Union[int, str]]):
    _predefined_keys = {
        "pseudo": str,
        "joined": int,
        "PM-State": bool,
        "left": List[int]
    }

    @classmethod
    def predefined_types(cls) -> Dict[str, type]:
        return cls._predefined_keys

    def __init__(self, *args, **kwargs):
        for key, value_type in self._predefined_keys.items():
            if key not in kwargs:
                kwargs[key] = None
            elif not isinstance(kwargs[key], value_type):
                raise TypeError(f"Invalid type for '{key}'. Expected {value_type.__name__}")
        super().__init__(*args, **kwargs)
