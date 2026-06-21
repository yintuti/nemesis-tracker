import aiomysql
import os
from dotenv import load_dotenv

load_dotenv()
pool: aiomysql.Pool | None = None


async def connect_db() -> None:
    global pool
    try:
        pool = await aiomysql.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            db=os.getenv("DB_NAME", "nemesis_tracker"),
            minsize=1,
            maxsize=10,
            autocommit=True,
            charset="utf8mb4",
        )
        print(f"MySQL connected successfully to database: {os.getenv('DB_NAME')}")
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        raise SystemExit(1)


async def disconnect_db() -> None:
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()
        print("MySQL connection closed.")


def get_pool() -> aiomysql.Pool:
    if pool is None:
        raise RuntimeError("Database pool has not been initialized.")
    return pool
