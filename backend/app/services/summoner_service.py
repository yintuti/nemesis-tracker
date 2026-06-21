import os
import aiohttp
import aiomysql
from dotenv import load_dotenv

load_dotenv()

RIOT_API_KEY = os.getenv("RIOT_API_KEY")

# Riot API uses different regions for account data and game data.
ACCOUNT_REGION = "americas"  # Used to fetch the PUUID by Riot ID.


async def get_or_create_summoner(
    game_name: str,
    tag_line: str,
    pool: aiomysql.Pool,
) -> dict:
    """
    1. Fetch the PUUID from the Riot API using game_name + tag_line
    2. Save or update the player in the summoners table
    3. Return the stored player data
    """
    puuid = await _fetch_puuid_from_riot(game_name, tag_line)
    summoner = await _upsert_summoner(puuid, game_name, tag_line, pool)
    return summoner


async def _fetch_puuid_from_riot(game_name: str, tag_line: str) -> str:
    """
    Call the Riot API endpoint to get the PUUID
    from the Riot ID (game_name#tag_line).
    """
    url = (
        f"https://{ACCOUNT_REGION}.api.riotgames.com"
        f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
    )
    headers = {"X-Riot-Token": RIOT_API_KEY}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 404:
                raise ValueError(f"Summoner '{game_name}#{tag_line}' not found.")
            if response.status == 403:
                raise PermissionError("Riot API key is invalid or expired.")
            if response.status != 200:
                raise RuntimeError(f"Riot API error: {response.status}")

            data = await response.json()
            return data["puuid"]


async def _upsert_summoner(
    puuid: str,
    game_name: str,
    tag_line: str,
    pool: aiomysql.Pool,
) -> dict:
    """
    Insert the player in the database if it does not exist,
    or update game_name/tag_line if it already exists.
    Return the stored data.
    """
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                """
                INSERT INTO summoners (puuid, game_name, tag_line)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    game_name = VALUES(game_name),
                    tag_line  = VALUES(tag_line),
                    updated_at = CURRENT_TIMESTAMP
                """,
                (puuid, game_name, tag_line),
            )

            # Fetch the updated record to return it.
            await cursor.execute(
                "SELECT * FROM summoners WHERE puuid = %s",
                (puuid,),
            )
            return await cursor.fetchone()
