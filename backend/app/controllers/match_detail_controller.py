from fastapi import HTTPException, Depends
from aiomysql import Pool
from app.services.match_detail_service import fetch_match_detail
from app.services.history_service import insert_match_with_sliding_window


async def handle_get_match_detail(match_id: str, puuid: str, pool: Pool) -> dict:
    try:
        detail = await fetch_match_detail(match_id, puuid)
        if detail is None:
            raise HTTPException(
                status_code=422,
                detail="Invalid match: remake or unidentified lane."
            )

        insert_result = await insert_match_with_sliding_window(puuid, detail, pool)

        return {
            **detail,
            "db": insert_result,
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
