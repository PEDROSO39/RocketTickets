import enum
from datetime import datetime

from pydantic import BaseModel

from prax.models.ticket import TicketStatus


class SLAStatus(str, enum.Enum):
    ON_TIME = "on_time"
    WARNING = "warning"
    CRITICAL = "critical"
    OVERDUE = "overdue"


class SLAConfigCreate(BaseModel):
    category: str
    warning_hours: int = 24
    critical_hours: int = 8


class TicketSLA(BaseModel):
    ticket_id: str
    title: str
    status: TicketStatus
    priority: str
    deadline: datetime | None
    created_at: datetime
    sla_status: str
    hours_remaining: float | None
    message: str


class SLASummary(BaseModel):
    total: int
    on_time: int
    warning: int
    critical: int
    overdue: int
    by_priority: dict[str, dict[str, int]]
