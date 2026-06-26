import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from prax.database import Base


class AnotacaoAtendimento(Base):
    __tablename__ = "anotacoes_atendimento"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("tickets.id"), index=True, nullable=True)
    cliente: Mapped[str] = mapped_column(String(255), default="")
    titulo: Mapped[str] = mapped_column(String(255), default="")
    modulo: Mapped[str] = mapped_column(String(100), default="")
    assunto: Mapped[str] = mapped_column(String(255), default="")
    descricao: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status: Mapped[str] = mapped_column(String(20), default="pendente")
    client_code: Mapped[str] = mapped_column(String(50), nullable=True)
    system_code: Mapped[str] = mapped_column(String(50), nullable=True)
    module_id: Mapped[str] = mapped_column(String(50), nullable=True)
    contact_id: Mapped[str] = mapped_column(String(50), nullable=True)
    praxio_ticket_id: Mapped[str] = mapped_column(String(50), nullable=True)
    praxio_url: Mapped[str] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
