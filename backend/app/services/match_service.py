import os
import aiohttp
from dotenv import load_dotenv
 
load_dotenv()
 
RIOT_API_KEY = os.getenv("RIOT_API_KEY")
MATCH_REGION = "americas"
 
 
async def fetch_match_ids(puuid: str, count: int = 20) -> list[str]:
    """
    Fetch the latest ranked solo/duo match IDs
    for the player from the Riot API.
 
    - queue=420: Ranked Solo/Duo
    - count: number of matches, up to 100 per request
    """
    url = (
        f"https://{MATCH_REGION}.api.riotgames.com"
        f"/lol/match/v5/matches/by-puuid/{puuid}/ids"
        f"?queue=420&count={count}"
    )
    headers = {"X-Riot-Token": RIOT_API_KEY}
 
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 403:
                raise PermissionError("Riot API key is invalid or expired.")
            if response.status != 200:
                raise RuntimeError(f"Riot API error: {response.status}")
 
            match_ids = await response.json()
            return match_ids
