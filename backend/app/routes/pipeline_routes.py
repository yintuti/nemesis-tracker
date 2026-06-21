from fastapi import APIRouter, Depends, Query
from aiomysql import Pool
from app.config.database import get_pool
from app.controllers.pipeline_controller import handle_run_pipeline
from app.services.champion_stats_service import get_champion_stats

router = APIRouter(prefix="/player", tags=["Player"])


@router.get("/champions/{puuid}")
async def get_player_champions(
    puuid: str,
    pool: Pool = Depends(get_pool),
):
    return await get_champion_stats(puuid, pool)


@router.get("/{game_name}/{tag_line}")
async def get_player(
    game_name: str,
    tag_line: str,
    match_count: int = Query(default=20, ge=1, le=100),
    pool: Pool = Depends(get_pool),
):
    return await handle_run_pipeline(game_name, tag_line, pool, match_count)