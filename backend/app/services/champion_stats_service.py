import aiomysql


async def increment_champion_stats(
    puuid: str,
    champion: str,
    win: bool,
    pool: aiomysql.Pool,
) -> None:
    win_increment = 1 if win else 0
    loss_increment = 0 if win else 1

    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """
                INSERT INTO champion_stats (puuid, champion, wins, losses)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    wins   = wins   + VALUES(wins),
                    losses = losses + VALUES(losses)
                """,
                [puuid, champion, win_increment, loss_increment],
            )


async def decrement_champion_stats(
    puuid: str,
    champion: str,
    win: bool,
    pool: aiomysql.Pool,
) -> None:
    async with pool.acquire() as conn:
        async with conn.cursor() as cursor:
            if win:
                await cursor.execute(
                    """
                    UPDATE champion_stats
                    SET wins = GREATEST(0, wins - 1)
                    WHERE puuid = %s AND champion = %s
                    """,
                    [puuid, champion],
                )
            else:
                await cursor.execute(
                    """
                    UPDATE champion_stats
                    SET losses = GREATEST(0, losses - 1)
                    WHERE puuid = %s AND champion = %s
                    """,
                    [puuid, champion],
                )


async def get_champion_stats(puuid: str, pool: aiomysql.Pool) -> list:
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                """
                SELECT
                    champion,
                    wins,
                    losses,
                    wins + losses as total,
                    ROUND(wins / (wins + losses) * 100, 1) as winrate
                FROM champion_stats
                WHERE puuid = %s AND (wins + losses) > 0
                ORDER BY winrate DESC, total DESC
                """,
                (puuid,),
            )
            return await cursor.fetchall()