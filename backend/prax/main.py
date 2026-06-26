import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from prax.config import settings
from prax.database import init_db
from prax.routers import notes, procedures, sla, sync, tickets, clients, user, anotacao

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PRAX - Workflow Portal Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(notes.router)
app.include_router(procedures.router)
app.include_router(sla.router)
app.include_router(sync.router)
app.include_router(clients.router)
app.include_router(user.router)
app.include_router(anotacao.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
