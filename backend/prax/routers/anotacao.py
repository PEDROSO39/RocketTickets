import logging
from datetime import datetime

from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prax.config import settings
from prax.database import get_db
from prax.exceptions import http_404
from prax.models.anotacao import AnotacaoAtendimento
from prax.schemas.anotacao import AnotacaoCreate, AnotacaoResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/anotacoes", tags=["anotacoes"])


@router.get("", response_model=list[AnotacaoResponse])
async def list_anotacoes(ticket_id: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(AnotacaoAtendimento)
    if ticket_id:
        query = query.where(AnotacaoAtendimento.ticket_id == ticket_id)
    else:
        query = query.where(AnotacaoAtendimento.ticket_id.is_(None))
    result = await db.execute(query.order_by(AnotacaoAtendimento.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=AnotacaoResponse, status_code=201)
async def create_anotacao(data: AnotacaoCreate, db: AsyncSession = Depends(get_db)):
    anotacao = AnotacaoAtendimento(**data.model_dump())
    db.add(anotacao)
    await db.commit()
    await db.refresh(anotacao)
    return anotacao


@router.delete("/{anotacao_id}", status_code=204)
async def delete_anotacao(anotacao_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AnotacaoAtendimento).where(AnotacaoAtendimento.id == anotacao_id)
    )
    anotacao = result.scalar_one_or_none()
    if not anotacao:
        raise http_404("Anotacao not found")
    await db.delete(anotacao)
    await db.commit()


@router.patch("/{anotacao_id}", response_model=AnotacaoResponse)
async def update_anotacao(anotacao_id: str, data: AnotacaoCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AnotacaoAtendimento).where(AnotacaoAtendimento.id == anotacao_id)
    )
    anotacao = result.scalar_one_or_none()
    if not anotacao:
        raise http_404("Anotacao not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(anotacao, field, value)
    await db.commit()
    await db.refresh(anotacao)
    return anotacao


@router.post("/sync")
async def sync_anotacoes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AnotacaoAtendimento)
        .where(AnotacaoAtendimento.status == "pendente")
        .where(AnotacaoAtendimento.ticket_id.is_(None))
        .order_by(AnotacaoAtendimento.created_at.asc())
    )
    pendentes = result.scalars().all()

    if not pendentes:
        return {"total": 0, "enviados": 0, "erros": 0, "message": "Nenhum rascunho pendente"}

    enviados = 0
    erros = 0

    from prax.scraper.client import PraxioClient
    client = PraxioClient()

    try:
        for anotacao in pendentes:
            try:
                if not anotacao.client_code or not anotacao.system_code or not anotacao.module_id:
                    anotacao.status = "erro"
                    anotacao.error_message = "Dados PRAXIO incompletos (client_code, system_code, module_id)"
                    erros += 1
                    continue

                contacts = await client.fetch_contacts(anotacao.client_code)
                contact_id = anotacao.contact_id or ""
                if not contact_id and contacts:
                    contact_id = contacts[0]["value"]

                operators = await client.fetch_operators(anotacao.module_id, "2")
                logged_user = settings.praxio_username.lower()
                responsible_id = ""
                operator_id = ""
                for op in operators:
                    if logged_user in op["text"].lower():
                        responsible_id = op["value"]
                        operator_id = op["value"]
                        break
                if not responsible_id and operators:
                    responsible_id = operators[0]["value"]
                    operator_id = operators[0]["value"]

                form_data = {
                    "TicketMlo.Cliente.Codigo": anotacao.client_code,
                    "TicketMlo.OperadorContato.Id": contact_id,
                    "Sistema": anotacao.system_code,
                    "TicketMlo.Modulo.Id": anotacao.module_id,
                    "TicketMlo.TicketDetalhes.Origem": "3",
                    "TicketMlo.OperadorResponsavel.Id": responsible_id,
                    "TicketMlo.GrupoTipo": "2",
                    "Responsavel": responsible_id,
                    "TicketMlo.Assunto": anotacao.assunto or anotacao.titulo or "",
                    "TicketMlo.DataHoraAbertura": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                    "TicketMlo.DataHoraLimite": "",
                    "AutoTexto": "",
                    "TramiteMlo.Operador.Id": operator_id,
                    "TramiteMlo.Descricao": anotacao.descricao or "",
                }

                response = await client.create_ticket(form_data)

                success = response.get("Sucesso", False)
                redirect = response.get("Redirect", "")
                msg_html = response.get("Mensagem", "")
                message = BeautifulSoup(msg_html, "lxml").get_text(strip=True) if msg_html else ""

                praxio_ticket_id = None
                if redirect:
                    parts = redirect.rstrip("/").split("/")
                    if parts and parts[-1].isdigit() and parts[-1] != "0":
                        praxio_ticket_id = parts[-1]

                if success and praxio_ticket_id:
                    anotacao.status = "enviado"
                    anotacao.praxio_ticket_id = praxio_ticket_id
                    anotacao.praxio_url = f"{client.base_url}/Ticket/TicketPrincipal/{praxio_ticket_id}"
                    enviados += 1
                else:
                    anotacao.status = "erro"
                    anotacao.error_message = message or "Erro ao criar ticket no PRAXIO"
                    erros += 1

            except Exception as e:
                logger.error(f"Failed to send anotacao {anotacao.id}: {e}")
                anotacao.status = "erro"
                anotacao.error_message = str(e)[:500]
                erros += 1

        await db.commit()

    finally:
        await client.close()

    return {"total": len(pendentes), "enviados": enviados, "erros": erros}
