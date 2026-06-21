from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import connect_db, disconnect_db
from app.routes.summoner_routes import router as summoner_router
from app.routes.match_routes import router as match_router
from app.routes.pipeline_routes import router as pipeline_router
from app.routes.nemesis_routes import router as nemesis_router
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="Nemesis Tracker API",
    version="0.1.0",
    description="League of Legends data platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summoner_router)
app.include_router(match_router)
app.include_router(pipeline_router)
app.include_router(nemesis_router)


@app.get("/")
async def root():
    return {
        "project": "Nemesis Tracker API",
        "status": "online",
        "version": "0.1.0",
        "message": "Hello World",
    }
