from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prax.database import get_db
from prax.exceptions import http_404
from prax.models.note import Note
from prax.schemas.note import NoteCreate, NoteResponse

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    ticket_id: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Note)
    if ticket_id:
        query = query.where(Note.ticket_id == ticket_id)
    query = query.order_by(Note.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        raise http_404("Note", note_id)
    return note


@router.post("", response_model=NoteResponse, status_code=201)
async def create_note(data: NoteCreate, db: AsyncSession = Depends(get_db)):
    note = Note(**data.model_dump())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: str, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        raise http_404("Note", note_id)
    await db.delete(note)
    await db.commit()
