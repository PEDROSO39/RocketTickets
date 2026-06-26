from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from prax.database import get_db
from prax.schemas.sla import SLASummary, TicketSLA
from prax.services.sla import get_all_sla_statuses, get_sla_summary

router = APIRouter(prefix="/api/sla", tags=["sla"])


@router.get("/status", response_model=list[TicketSLA])
async def sla_status(db: AsyncSession = Depends(get_db)):
    return await get_all_sla_statuses(db)


@router.get("/summary", response_model=SLASummary)
async def sla_summary(db: AsyncSession = Depends(get_db)):
    return await get_sla_summary(db)
