import aiomysql
from datetime import datetime
from app.services.matchup_service import increment_matchup_stats, decrement_matchup_stats
from app.services.champion_stats_service import increment_champion_stats, decrement_champion_stats

MAX_MATCH_HISTORY = 300


async def insert_match_with_sliding_window(
    puuid: str,
    match_data: dict,
    pool: aiomysql.Pool,
) -> dict:
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:

            await cursor.execute(
                "SELECT id FROM match_history WHERE match_id = %s AND puuid = %s",
                (match_data["match_id"], puuid),
            )
            if await cursor.fetchone():
                return {"status": "skipped", "reason": "Match already stored."}

            await cursor.execute(
                "SELECT COUNT(*) as total FROM match_history WHERE puuid = %s",
                (puuid,),
            )
            row = await cursor.fetchone()
            total = row["total"]

            deleted_match = None

            if total >= MAX_MATCH_HISTORY:
                await cursor.execute(
                    """
                    SELECT id, match_id, opponent_champion, champion_played, win
                    FROM match_history
                    WHERE puuid = %s
                    ORDER BY played_at ASC
                    LIMIT 1
                    """,
                    (puuid,),
                )
                oldest = await cursor.fetchone()
                if oldest:
                    await cursor.execute(
                        "DELETE FROM match_history WHERE id = %s",
                        (oldest["id"],),
                    )
                    deleted_match = oldest["match_id"]

                    await decrement_matchup_stats(
                        puuid,
                        oldest["opponent_champion"],
                        bool(oldest["win"]),
                        pool,
                    )
                    await decrement_champion_stats(
                        puuid,
                        oldest["champion_played"],
                        bool(oldest["win"]),
                        pool,
                    )

            played_at = datetime.fromtimestamp(match_data["played_at"] / 1000)
            lane_opponent = match_data.get("lane_opponent")

            await cursor.execute(
                """
                INSERT INTO match_history
                    (puuid, match_id, champion_played, role, opponent_champion, win, played_at)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    puuid,
                    match_data["match_id"],
                    match_data["champion_played"],
                    match_data["role"],
                    lane_opponent,
                    int(match_data["win"]),
                    played_at,
                ],
            )

            for enemy in match_data.get("enemies", []):
                await increment_matchup_stats(
                    puuid,
                    enemy["champion"],
                    match_data["win"],
                    pool,
                    is_lane_opponent=enemy["is_lane_opponent"],
                )

            await increment_champion_stats(
                puuid,
                match_data["champion_played"],
                match_data["win"],
                pool,
            )

            return {
                "status": "inserted",
                "match_id": match_data["match_id"],
                "deleted_oldest": deleted_match,
                "total_after": min(total + 1, MAX_MATCH_HISTORY),
            }
