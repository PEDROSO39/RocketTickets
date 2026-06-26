from datetime import datetime

from pydantic import BaseModel, Field

from prax.models.ticket import TicketStatus


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    status: TicketStatus = TicketStatus.open
    priority: str = "medium"
    category: str = "general"
    deadline: datetime | None = None
    wscan_grupo_id: str | None = None
    wscan_ocorrencia_id: str | None = None
    wscan_responsavel: str | None = None
    wscan_status_raw: str | None = None


class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TicketStatus | None = None
    priority: str | None = None
    category: str | None = None
    deadline: datetime | None = None


class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    status: TicketStatus
    priority: str
    category: str
    wscan_grupo_id: str | None
    wscan_ocorrencia_id: str | None
    wscan_responsavel: str | None
    wscan_status_raw: str | None
    created_at: datetime
    updated_at: datetime
    deadline: datetime | None
    closed_at: datetime | None

    model_config = {"from_attributes": True}
