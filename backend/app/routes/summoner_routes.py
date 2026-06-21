from fastapi import APIRouter, Depends
from aiomysql import Pool
from app.config.database import get_pool
from app.controllers.summoner_controller import handle_get_summoner

router = APIRouter(prefix="/summoner", tags=["Summoner"])


@router.get("/{game_name}/{tag_line}")
async def get_summoner(
    game_name: str,
    tag_line: str,
    pool: Pool = Depends(get_pool),
):
    """
    Look up a summoner by Riot ID (game_name + tag_line),
    save it in the database, and return the stored data.

    Example: GET /summoner/Faker/KR1
    """
    return await handle_get_summoner(game_name, tag_line, pool)
