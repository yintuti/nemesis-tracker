from fastapi import APIRouter, Depends
from aiomysql import Pool
from app.config.database import get_pool
from app.controllers.nemesis_controller import handle_get_nemesis
from app.services.nemesis_service import get_matchups_by_champion_played, get_stats_by_role

router = APIRouter(prefix="/nemesis", tags=["Nemesis"])


@router.get("/{puuid}")
async def get_nemesis(puuid: str, pool: Pool = Depends(get_pool)):
    return await handle_get_nemesis(puuid, pool)


@router.get("/{puuid}/champion/{champion}")
async def get_champion_matchups(puuid: str, champion: str, pool: Pool = Depends(get_pool)):
    return await get_matchups_by_champion_played(puuid, champion, pool)


@router.get("/{puuid}/roles")
async def get_role_stats(puuid: str, pool: Pool = Depends(get_pool)):
    return await get_stats_by_role(puuid, pool)