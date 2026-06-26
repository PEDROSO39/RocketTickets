from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prax.models.ticket import Ticket, TicketStatus
from prax.scraper.client import PraxioClient


def parse_date(val: str | None) -> datetime | None:
    if not val or val.strip() == "":
        return None
    for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(val.strip(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


STATUS_MAP = {
    "ticket aberto": TicketStatus.open,
    "em andamento": TicketStatus.in_progress,
    "pendente cliente": TicketStatus.waiting,
    "aguardando adequação": TicketStatus.waiting,
    "concluído": TicketStatus.closed,
    "concludo": TicketStatus.closed,
    "cancelado": TicketStatus.closed,
    "reaberto": TicketStatus.open,
}


async def sync_tickets(client: PraxioClient, db: AsyncSession) -> int:
    rows = await client.fetch_tickets()

    seen = set()
    unique_rows = []
    for row in rows:
        tn = row.get("ticket_number", "")
        if tn and tn not in seen:
            seen.add(tn)
            unique_rows.append(row)

    count = 0
    for row in unique_rows:
        ticket_number = row.get("ticket_number", "")
        if not ticket_number:
            continue

        raw_status = row.get("status", "").lower().strip()
        ticket_status = STATUS_MAP.get(raw_status, TicketStatus.open)

        existing_result = await db.execute(
            select(Ticket).where(Ticket.wscan_grupo_id == ticket_number)
        )
        existing = existing_result.scalar_one_or_none()

        open_date = parse_date(row.get("open_date"))
        close_date = parse_date(row.get("close_date"))
        deadline = close_date

        if existing:
            existing.title = row.get("subject", existing.title)
            existing.status = ticket_status
            existing.priority = "medium"
            existing.category = row.get("module", existing.category)
            existing.wscan_responsavel = row.get("responsible")
            existing.wscan_status_raw = row.get("status")
            existing.updated_at = datetime.now(timezone.utc)
            if deadline:
                existing.deadline = deadline
            if ticket_status == TicketStatus.closed and not existing.closed_at:
                existing.closed_at = datetime.now(timezone.utc)
        else:
            db.add(Ticket(
                title=row.get("subject", f"Ticket {ticket_number}"),
                description=(
                    f"Client: {row.get('client', '')}\n"
                    f"Requester: {row.get('requester', '')}\n"
                    f"System: {row.get('system', '')}\n"
                    f"Module: {row.get('module', '')}\n"
                    f"Group: {row.get('group', '')}\n"
                    f"Origin: {row.get('origin', '')}"
                ),
                status=ticket_status,
                priority="medium",
                category=row.get("module", "general"),
                wscan_grupo_id=ticket_number,
                wscan_ocorrencia_id=row.get("ticket_id"),
                wscan_responsavel=row.get("responsible"),
                wscan_status_raw=row.get("status"),
                deadline=deadline,
                closed_at=datetime.now(timezone.utc) if ticket_status == TicketStatus.closed else None,
                created_at=open_date or datetime.now(timezone.utc),
            ))
        count += 1

    await db.commit()
    return count
