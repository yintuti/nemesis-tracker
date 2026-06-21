from fastapi import APIRouter, Depends
from aiomysql import Pool
from app.config.database import get_pool
from app.controllers.match_controller import handle_get_match_ids
from app.controllers.match_detail_controller import handle_get_match_detail

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("/{puuid}")
async def get_match_ids(puuid: str, count: int = 20):
    return await handle_get_match_ids(puuid, count)


@router.get("/detail/{match_id}")
async def get_match_detail(
    match_id: str,
    puuid: str,
    pool: Pool = Depends(get_pool),
):
    return await handle_get_match_detail(match_id, puuid, pool)