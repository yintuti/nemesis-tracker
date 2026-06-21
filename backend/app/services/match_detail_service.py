import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

RIOT_API_KEY = os.getenv("RIOT_API_KEY")
MATCH_REGION = "americas"


async def fetch_match_detail(match_id: str, puuid: str) -> dict | None:
    raw_data = await _fetch_raw_match(match_id)
    return _extract_matchup_data(raw_data, puuid, match_id)


async def _fetch_raw_match(match_id: str) -> dict:
    url = (
        f"https://{MATCH_REGION}.api.riotgames.com"
        f"/lol/match/v5/matches/{match_id}"
    )
    headers = {"X-Riot-Token": RIOT_API_KEY}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 403:
                raise PermissionError("Riot API key is invalid or expired.")
            if response.status != 200:
                raise RuntimeError(f"Riot API error: {response.status}")
            return await response.json()


def _extract_matchup_data(raw_data: dict, puuid: str, match_id: str) -> dict | None:
    participants = raw_data["info"]["participants"]

    player = next((p for p in participants if p["puuid"] == puuid), None)
    if not player:
        return None

    game_duration = raw_data["info"].get("gameDuration", 0)
    if game_duration < 180:
        return None

    player_role = player.get("teamPosition", "")
    player_team_id = player["teamId"]

    enemies = [p for p in participants if p["teamId"] != player_team_id]

    lane_opponent = next(
        (
            p for p in enemies
            if p.get("teamPosition", "") == player_role and player_role != ""
        ),
        None,
    )

    enemy_list = [
        {
            "champion": p["championName"],
            "is_lane_opponent": (
                lane_opponent is not None
                and p["championName"] == lane_opponent["championName"]
            ),
        }
        for p in enemies
    ]

    return {
        "match_id": match_id,
        "champion_played": player["championName"],
        "role": player_role,
        "lane_opponent": lane_opponent["championName"] if lane_opponent else None,
        "enemies": enemy_list,
        "win": player["win"],
        "game_duration": game_duration,
        "played_at": raw_data["info"]["gameStartTimestamp"],
    }
