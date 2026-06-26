from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from prax.database import get_db
from prax.exceptions import http_500
from prax.scraper.client import PraxioClient
from prax.services.sync import sync_tickets

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("/run")
async def run_sync(db: AsyncSession = Depends(get_db)):
    client = PraxioClient()
    try:
        tickets = await sync_tickets(client, db)
    except Exception as e:
        raise http_500(f"Sync failed: {e}")

    return {
        "status": "ok",
        "tickets_synced": tickets,
    }
