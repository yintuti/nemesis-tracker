import aiomysql


async def increment_matchup_stats(
    puuid: str,
    opponent_champion: str,
    win: bool,
    pool: aiomysql.Pool,
    is_lane_opponent: bool = False,
) -> None:
    win_increment = 1 if win else 0
    loss_increment = 0 if win else 1

    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """
                INSERT INTO matchup_stats (puuid, opponent_champion, wins, losses, is_lane_opponent)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    wins             = wins   + VALUES(wins),
                    losses           = losses + VALUES(losses),
                    is_lane_opponent = is_lane_opponent OR VALUES(is_lane_opponent)
                """,
                [puuid, opponent_champion, win_increment, loss_increment, int(is_lane_opponent)],
            )


async def decrement_matchup_stats(
    puuid: str,
    opponent_champion: str,
    win: bool,
    pool: aiomysql.Pool,
) -> None:
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            if win:
                await cursor.execute(
                    """
                    UPDATE matchup_stats
                    SET wins = GREATEST(0, wins - 1)
                    WHERE puuid = %s AND opponent_champion = %s
                    """,
                    [puuid, opponent_champion],
                )
            else:
                await cursor.execute(
                    """
                    UPDATE matchup_stats
                    SET losses = GREATEST(0, losses - 1)
                    WHERE puuid = %s AND opponent_champion = %s
                    """,
                    [puuid, opponent_champion],
                )