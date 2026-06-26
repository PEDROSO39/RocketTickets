from datetime import datetime

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    ticket_id: str
    content: str = Field(..., min_length=1)
    author: str = "system"


class NoteResponse(BaseModel):
    id: str
    ticket_id: str
    content: str
    author: str
    created_at: datetime

    model_config = {"from_attributes": True}
