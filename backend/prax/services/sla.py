from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from prax.config import settings
from prax.models.sla import SLAConfig
from prax.models.ticket import Ticket, TicketStatus
from prax.schemas.sla import SLAStatus, SLASummary, TicketSLA

PRIORITY_HOURS = {
    "urgent": settings.sla_urgent_hours,
    "high": settings.sla_high_hours,
    "medium": settings.sla_medium_hours,
    "low": settings.sla_low_hours,
}

PRIORITY_WARNING_RATIO = 0.25
PRIORITY_CRITICAL_RATIO = 0.10


async def get_sla_config(db: AsyncSession, category: str) -> tuple[int, int]:
    result = await db.execute(select(SLAConfig).where(SLAConfig.category == category))
    config = result.scalar_one_or_none()
    if config:
        return config.warning_hours, config.critical_hours
    return settings.sla_warning_hours, settings.sla_critical_hours


def get_effective_deadline(ticket: Ticket) -> datetime | None:
    if ticket.deadline:
        return ticket.deadline.replace(tzinfo=timezone.utc)

    if ticket.created_at:
        created = ticket.created_at.replace(tzinfo=timezone.utc)
        hours = PRIORITY_HOURS.get(ticket.priority, settings.sla_medium_hours)
        return created + timedelta(hours=hours)

    return None


def calculate_sla_status(
    ticket: Ticket,
    warning_hours: int,
    critical_hours: int,
) -> TicketSLA:
    now = datetime.now(timezone.utc)

    if ticket.status in (TicketStatus.resolved, TicketStatus.closed):
        return TicketSLA(
            ticket_id=ticket.id,
            title=ticket.title,
            status=ticket.status,
            priority=ticket.priority,
            deadline=ticket.deadline,
            created_at=ticket.created_at,
            sla_status="completed",
            hours_remaining=None,
            message="Ticket is closed/resolved",
        )

    deadline = get_effective_deadline(ticket)
    if not deadline:
        return TicketSLA(
            ticket_id=ticket.id,
            title=ticket.title,
            status=ticket.status,
            priority=ticket.priority,
            deadline=None,
            created_at=ticket.created_at,
            sla_status="no_deadline",
            hours_remaining=None,
            message="No deadline set",
        )

    remaining = (deadline - now).total_seconds() / 3600

    total_hours = (deadline - ticket.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600 if ticket.created_at else 72
    warning_threshold = total_hours * PRIORITY_WARNING_RATIO
    critical_threshold = total_hours * PRIORITY_CRITICAL_RATIO

    if remaining < 0:
        status = SLAStatus.OVERDUE
        msg = f"Atrasado por {abs(remaining):.1f}h"
    elif remaining < critical_threshold:
        status = SLAStatus.CRITICAL
        msg = f"Restam {remaining:.1f}h (critico)"
    elif remaining < warning_threshold:
        status = SLAStatus.WARNING
        msg = f"Restam {remaining:.1f}h (atencao)"
    else:
        status = SLAStatus.ON_TIME
        msg = f"Restam {remaining:.1f}h"

    return TicketSLA(
        ticket_id=ticket.id,
        title=ticket.title,
        status=ticket.status,
        priority=ticket.priority,
        deadline=deadline.replace(tzinfo=None) if deadline else None,
        created_at=ticket.created_at,
        sla_status=status,
        hours_remaining=round(remaining, 1),
        message=msg,
    )


async def get_all_sla_statuses(db: AsyncSession) -> list[TicketSLA]:
    result = await db.execute(
        select(Ticket).where(
            Ticket.status.notin_([TicketStatus.closed, TicketStatus.resolved])
        )
    )
    tickets = result.scalars().all()

    statuses = []
    for ticket in tickets:
        warning, critical = await get_sla_config(db, ticket.category)
        statuses.append(calculate_sla_status(ticket, warning, critical))

    return statuses


async def get_sla_summary(db: AsyncSession) -> SLASummary:
    statuses = await get_all_sla_statuses(db)

    summary = SLASummary(
        total=len(statuses),
        on_time=0,
        warning=0,
        critical=0,
        overdue=0,
        by_priority={},
    )

    for s in statuses:
        sla_val = s.sla_status.value if hasattr(s.sla_status, "value") else s.sla_status
        if sla_val == SLAStatus.ON_TIME.value:
            summary.on_time += 1
        elif sla_val == SLAStatus.WARNING.value:
            summary.warning += 1
        elif sla_val == SLAStatus.CRITICAL.value:
            summary.critical += 1
        elif sla_val == SLAStatus.OVERDUE.value:
            summary.overdue += 1

        if s.priority not in summary.by_priority:
            summary.by_priority[s.priority] = {"on_time": 0, "warning": 0, "critical": 0, "overdue": 0}
        if sla_val in summary.by_priority[s.priority]:
            summary.by_priority[s.priority][sla_val] += 1

    return summary
