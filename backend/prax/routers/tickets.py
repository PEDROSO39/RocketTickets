from datetime import datetime, timezone
from bs4 import BeautifulSoup

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from prax.config import settings
from prax.database import get_db
from prax.exceptions import http_404, http_500
from prax.models.ticket import Ticket, TicketStatus
from prax.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate
from prax.scraper.client import PraxioClient

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


class PraxioTicketCreate(BaseModel):
    client_code: str
    system_code: str
    module_id: str
    subject: str
    description: str = ""
    contact_id: str = ""
    origin: str = "3"
    group_type: str = "2"
    operator_id: str = "55401"
    deadline: str = ""


class PraxioTicketResponse(BaseModel):
    success: bool
    message: str
    redirect: str
    ticket_id: str | None = None
    praxio_url: str | None = None


@router.get("", response_model=list[TicketResponse])
async def list_tickets(
    status: TicketStatus | None = None,
    category: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    client: str | None = None,
    responsible: str | None = None,
    system: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Ticket)
    if status:
        query = query.where(Ticket.status == status)
    if category:
        query = query.where(Ticket.category == category)
    if priority:
        query = query.where(Ticket.priority == priority)
    if system:
        query = query.where(Ticket.description.contains(f"System: {system}"))
    if responsible:
        query = query.where(Ticket.wscan_responsavel.contains(responsible))
    if client:
        query = query.where(Ticket.description.contains(f"Client: {client}"))
    if search:
        s = f"%{search}%"
        query = query.where(
            (Ticket.title.ilike(s)) |
            (Ticket.wscan_grupo_id.ilike(s)) |
            (Ticket.description.ilike(s)) |
            (Ticket.wscan_responsavel.ilike(s))
        )
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from)
            query = query.where(Ticket.created_at >= dt)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            query = query.where(Ticket.created_at <= dt)
        except ValueError:
            pass
    query = query.order_by(Ticket.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise http_404("Ticket", ticket_id)
    return ticket


class TicketMessage(BaseModel):
    date: str
    author: str
    content: str
    status: str = ""


@router.get("/{ticket_id}/messages", response_model=list[TicketMessage])
async def get_ticket_messages(ticket_id: str, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise http_404("Ticket", ticket_id)

    praxio_id = ticket.wscan_ocorrencia_id
    if not praxio_id:
        return []

    client = PraxioClient()
    try:
        messages = await client.fetch_ticket_messages(praxio_id)
        return [TicketMessage(**m) for m in messages]
    except Exception as e:
        raise http_500(f"Failed to fetch messages: {e}")
    finally:
        await client.close()


@router.post("", response_model=TicketResponse, status_code=201)
async def create_ticket(data: TicketCreate, db: AsyncSession = Depends(get_db)):
    ticket = Ticket(**data.model_dump())
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.post("/praxio", response_model=PraxioTicketResponse)
async def create_praxio_ticket(data: PraxioTicketCreate, db: AsyncSession = Depends(get_db)):
    client = PraxioClient()
    try:
        contacts = await client.fetch_contacts(data.client_code)
        contact_id = data.contact_id
        if not contact_id and contacts:
            contact_id = contacts[0]["value"]

        operators = await client.fetch_operators(data.module_id, data.group_type)
        logged_user = settings.praxio_username.lower()
        responsible_id = ""
        operator_id = data.operator_id
        for op in operators:
            if logged_user in op["text"].lower():
                responsible_id = op["value"]
                operator_id = op["value"]
                break
        if not responsible_id and operators:
            responsible_id = operators[0]["value"]
            operator_id = operators[0]["value"]

        form_data = {
            "TicketMlo.Cliente.Codigo": data.client_code,
            "TicketMlo.OperadorContato.Id": contact_id,
            "Sistema": data.system_code,
            "TicketMlo.Modulo.Id": data.module_id,
            "TicketMlo.TicketDetalhes.Origem": data.origin,
            "TicketMlo.OperadorResponsavel.Id": responsible_id,
            "TicketMlo.GrupoTipo": data.group_type,
            "Responsavel": responsible_id,
            "TicketMlo.Assunto": data.subject,
            "TicketMlo.DataHoraAbertura": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "TicketMlo.DataHoraLimite": data.deadline,
            "AutoTexto": "",
            "TramiteMlo.Operador.Id": operator_id,
            "TramiteMlo.Descricao": data.description,
        }

        result = await client.create_ticket(form_data)
    except Exception as e:
        raise http_500(f"Failed to create ticket on PRAXIO: {e}")
    finally:
        await client.close()

    success = result.get("Sucesso", False)
    redirect = result.get("Redirect", "")
    msg_html = result.get("Mensagem", "")
    message = BeautifulSoup(msg_html, "lxml").get_text(strip=True) if msg_html else ""

    praxio_ticket_id = None
    if redirect:
        parts = redirect.rstrip("/").split("/")
        if parts and parts[-1].isdigit() and parts[-1] != "0":
            praxio_ticket_id = parts[-1]

    if success and praxio_ticket_id:
        praxio_url = f"{client.base_url}/Ticket/TicketPrincipal/{praxio_ticket_id}"
        ticket = Ticket(
            title=data.subject,
            description=data.description,
            status=TicketStatus.open,
            priority="medium",
            category=data.system_code,
            wscan_grupo_id=f"PRA-{praxio_ticket_id}",
            wscan_ocorrencia_id=praxio_ticket_id,
            wscan_responsavel=responsible_id,
            wscan_status_raw="Ticket aberto",
            deadline=datetime.strptime(data.deadline, "%d/%m/%Y %H:%M:%S").replace(tzinfo=timezone.utc) if data.deadline else None,
        )
        db.add(ticket)
        await db.commit()
    else:
        praxio_url = f"{client.base_url}/Ticket/NovoTicket"

    return PraxioTicketResponse(
        success=success and praxio_ticket_id is not None,
        message=message or ("Ticket criado com sucesso" if success else "Falha ao criar ticket"),
        redirect=redirect,
        ticket_id=praxio_ticket_id,
        praxio_url=praxio_url,
    )


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(ticket_id: str, data: TicketUpdate, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise http_404("Ticket", ticket_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ticket, field, value)

    if data.status == TicketStatus.closed and not ticket.closed_at:
        ticket.closed_at = datetime.now(timezone.utc)

    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=204)
async def delete_ticket(ticket_id: str, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise http_404("Ticket", ticket_id)
    await db.delete(ticket)
    await db.commit()


@router.get("/summary/by-status", response_model=dict[str, int])
async def summary_by_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Ticket.status, func.count()).group_by(Ticket.status)
    )
    return {row[0].value: row[1] for row in result.all()}


@router.get("/summary/by-category", response_model=dict[str, int])
async def summary_by_category(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Ticket.category, func.count()).group_by(Ticket.category)
    )
    return {row[0]: row[1] for row in result.all()}
