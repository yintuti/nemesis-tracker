from fastapi import HTTPException
from app.services.match_service import fetch_match_ids


async def handle_get_match_ids(puuid: str, count: int = 20) -> dict:
    """
    Orchestrate match ID lookup.
    Convert service errors into appropriate HTTP responses.
    """
    try:
        match_ids = await fetch_match_ids(puuid, count)
        return {
            "puuid": puuid,
            "count": len(match_ids),
            "match_ids": match_ids,
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
