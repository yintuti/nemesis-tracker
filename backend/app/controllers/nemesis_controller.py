from fastapi import HTTPException
from aiomysql import Pool
from app.services.nemesis_service import get_nemesis_data


async def handle_get_nemesis(puuid: str, pool: Pool) -> dict:
    try:
        return await get_nemesis_data(puuid, pool)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
