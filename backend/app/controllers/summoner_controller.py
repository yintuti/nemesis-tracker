from fastapi import HTTPException
from aiomysql import Pool
from app.services.summoner_service import get_or_create_summoner


async def handle_get_summoner(
    game_name: str,
    tag_line: str,
    pool: Pool,
) -> dict:
    """
    Orchestrate the summoner lookup.
    Convert service errors into appropriate HTTP responses.
    """
    try:
        summoner = await get_or_create_summoner(game_name, tag_line, pool)
        return summoner
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
