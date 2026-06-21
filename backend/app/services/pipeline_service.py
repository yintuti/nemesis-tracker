import aiomysql
from app.services.summoner_service import get_or_create_summoner
from app.services.match_service import fetch_match_ids
from app.services.match_detail_service import fetch_match_detail
from app.services.history_service import insert_match_with_sliding_window


async def run_pipeline(
    game_name: str,
    tag_line: str,
    pool: aiomysql.Pool,
    match_count: int = 20,
) -> dict:
    """
    Main endpoint orchestration:
    1. Look up or update the summoner
    2. Fetch the latest ranked match IDs
    3. Extract details for each match and insert them into the database
    4. Return consolidated database stats
    """

    # Step 1: Summoner
    summoner = await get_or_create_summoner(game_name, tag_line, pool)
    puuid = summoner["puuid"]

    # Step 2: Match IDs
    match_ids = await fetch_match_ids(puuid, count=match_count)

    # Step 3: Process each match
    results = {
        "inserted": 0,
        "skipped": 0,
        "failed": 0,
    }

    for match_id in match_ids:
        try:
            detail = await fetch_match_detail(match_id, puuid)
            if detail is None:
                results["skipped"] += 1
                continue

            insert_result = await insert_match_with_sliding_window(puuid, detail, pool)

            if insert_result["status"] == "inserted":
                results["inserted"] += 1
            else:
                results["skipped"] += 1

        except Exception:
            results["failed"] += 1
            continue

    # Step 4: Consolidated database stats
    stats = await _fetch_consolidated_stats(puuid, pool)

    return {
        "summoner": summoner,
        "pipeline": results,
        "stats": stats,
    }


async def _fetch_consolidated_stats(puuid: str, pool: aiomysql.Pool) -> dict:
    """
    Query the database and return:
    - Total stored matches
    - Top 5 champions with the most losses
    - Overall win rate
    """
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:

            # Total matches
            await cursor.execute(
                "SELECT COUNT(*) as total FROM match_history WHERE puuid = %s",
                (puuid,),
            )
            row = await cursor.fetchone()
            total_matches = row["total"]

            # Overall win rate
            await cursor.execute(
                """
                SELECT
                    SUM(wins) as total_wins,
                    SUM(losses) as total_losses
                FROM matchup_stats
                WHERE puuid = %s
                """,
                (puuid,),
            )
            wr_row = await cursor.fetchone()
            total_wins = wr_row["total_wins"] or 0
            total_losses = wr_row["total_losses"] or 0
            total_games = total_wins + total_losses
            winrate = round((total_wins / total_games) * 100, 1) if total_games > 0 else 0

            # Top 5 enemies by losses
            await cursor.execute(
                """
                SELECT
                    opponent_champion,
                    wins,
                    losses,
                    is_lane_opponent,
                    ROUND(wins / (wins + losses) * 100, 1) as winrate
                FROM matchup_stats
                WHERE puuid = %s AND (wins + losses) > 0
                ORDER BY losses DESC
                LIMIT 5
                """,
                (puuid,),
            )
            top_nemeses = await cursor.fetchall()

            return {
                "total_matches": total_matches,
                "winrate": winrate,
                "top_nemeses": top_nemeses,
            }
