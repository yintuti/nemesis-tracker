import aiomysql
from app.data.champion_loader import get_champion_class


async def get_nemesis_data(puuid: str, pool: aiomysql.Pool) -> dict:
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:

            await cursor.execute(
                """
                SELECT
                    opponent_champion,
                    wins,
                    losses,
                    wins + losses as total,
                    is_lane_opponent,
                    ROUND(wins / (wins + losses) * 100, 1) as winrate
                FROM matchup_stats
                WHERE puuid = %s AND (wins + losses) > 0
                ORDER BY losses DESC, winrate ASC
                """,
                (puuid,),
            )
            matchups = await cursor.fetchall()

    if not matchups:
        return {"nemesis": None, "class_stats": [], "champion_stats": []}

    nemesis = matchups[0]

    class_totals: dict[str, dict] = {}
    for m in matchups:
        cls = get_champion_class(m["opponent_champion"])
        if cls not in class_totals:
            class_totals[cls] = {"wins": 0, "losses": 0}
        class_totals[cls]["wins"] += m["wins"]
        class_totals[cls]["losses"] += m["losses"]

    class_stats = []
    for cls, data in class_totals.items():
        total = data["wins"] + data["losses"]
        class_stats.append({
            "class": cls,
            "wins": data["wins"],
            "losses": data["losses"],
            "total": total,
            "winrate": round(data["wins"] / total * 100, 1) if total > 0 else 0,
        })

    class_stats.sort(key=lambda x: x["winrate"])

    return {
        "nemesis": {
            "champion": nemesis["opponent_champion"],
            "wins": nemesis["wins"],
            "losses": nemesis["losses"],
            "winrate": nemesis["winrate"],
            "is_lane_opponent": bool(nemesis["is_lane_opponent"]),
            "class": get_champion_class(nemesis["opponent_champion"]),
        },
        "class_stats": class_stats,
        "champion_stats": [
            {
                **m,
                "class": get_champion_class(m["opponent_champion"]),
            }
            for m in matchups
        ],
    }

async def get_matchups_by_champion_played(puuid: str, champion: str, pool: aiomysql.Pool) -> list:
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                """
                SELECT
                    mh.opponent_champion,
                    SUM(mh.win) as wins,
                    SUM(1 - mh.win) as losses,
                    COUNT(*) as total,
                    ROUND(SUM(mh.win) / COUNT(*) * 100, 1) as winrate
                FROM match_history mh
                WHERE mh.puuid = %s AND mh.champion_played = %s
                AND mh.opponent_champion IS NOT NULL
                GROUP BY mh.opponent_champion
                HAVING total > 0
                ORDER BY total DESC, winrate ASC, mh.opponent_champion ASC
                """,
                (puuid, champion),
            )
            rows = await cursor.fetchall()
            return [
                {**r, "class": get_champion_class(r["opponent_champion"])}
                for r in rows
            ]

async def get_stats_by_role(puuid: str, pool: aiomysql.Pool) -> list:
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                """
                SELECT
                    role,
                    SUM(win) as wins,
                    SUM(1 - win) as losses,
                    ROUND(SUM(win) / COUNT(*) * 100, 1) as winrate,
                    opponent_champion,
                    COUNT(*) as games
                FROM match_history
                WHERE puuid = %s AND role != ''
                GROUP BY role, opponent_champion
                ORDER BY role, winrate ASC
                """,
                (puuid,),
            )
            rows = await cursor.fetchall()

            roles: dict = {}
            for r in rows:
                role = r["role"]
                if role not in roles:
                    roles[role] = {"role": role, "matchups": [], "wins": 0, "losses": 0}
                roles[role]["matchups"].append(r)
                roles[role]["wins"] += r["wins"]
                roles[role]["losses"] += r["losses"]

            result = []
            for role, data in roles.items():
                total = data["wins"] + data["losses"]
                sorted_matchups = sorted(data["matchups"], key=lambda x: x["winrate"])
                result.append({
                    "role": role,
                    "wins": data["wins"],
                    "losses": data["losses"],
                    "winrate": round(data["wins"] / total * 100, 1) if total > 0 else 0,
                    "worst": sorted_matchups[0] if sorted_matchups else None,
                    "best": sorted_matchups[-1] if sorted_matchups else None,
                })

            return result
