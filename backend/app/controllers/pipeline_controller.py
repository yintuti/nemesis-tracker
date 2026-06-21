from fastapi import HTTPException
from aiomysql import Pool
from app.services.pipeline_service import run_pipeline


async def handle_run_pipeline(
    game_name: str,
    tag_line: str,
    pool: Pool,
    match_count: int = 20,
) -> dict:
    try:
        return await run_pipeline(game_name, tag_line, pool, match_count)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
