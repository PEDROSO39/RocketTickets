from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prax.database import get_db
from prax.exceptions import http_404
from prax.models.procedure import Procedure
from prax.schemas.procedure import ProcedureCreate, ProcedureResponse, ProcedureUpdate

router = APIRouter(prefix="/api/procedures", tags=["procedures"])


@router.get("", response_model=list[ProcedureResponse])
async def list_procedures(
    category: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Procedure)
    if category:
        query = query.where(Procedure.category == category)
    query = query.order_by(Procedure.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{procedure_id}", response_model=ProcedureResponse)
async def get_procedure(procedure_id: str, db: AsyncSession = Depends(get_db)):
    proc = await db.get(Procedure, procedure_id)
    if not proc:
        raise http_404("Procedure", procedure_id)
    return proc


@router.post("", response_model=ProcedureResponse, status_code=201)
async def create_procedure(data: ProcedureCreate, db: AsyncSession = Depends(get_db)):
    proc = Procedure(**data.model_dump())
    db.add(proc)
    await db.commit()
    await db.refresh(proc)
    return proc


@router.patch("/{procedure_id}", response_model=ProcedureResponse)
async def update_procedure(procedure_id: str, data: ProcedureUpdate, db: AsyncSession = Depends(get_db)):
    proc = await db.get(Procedure, procedure_id)
    if not proc:
        raise http_404("Procedure", procedure_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(proc, field, value)

    await db.commit()
    await db.refresh(proc)
    return proc


@router.delete("/{procedure_id}", status_code=204)
async def delete_procedure(procedure_id: str, db: AsyncSession = Depends(get_db)):
    proc = await db.get(Procedure, procedure_id)
    if not proc:
        raise http_404("Procedure", procedure_id)
    await db.delete(proc)
    await db.commit()
