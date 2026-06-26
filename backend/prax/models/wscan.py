from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from prax.database import Base


class WscanGrupoOcorrencia(Base):
    __tablename__ = "wscan_grupos"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    descricao: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(50), default="")
    responsavel: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_grupo: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_atribuicao: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_envio_aprovador: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_finalizacao: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class WscanOcorrencia(Base):
    __tablename__ = "wscan_ocorrencias"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    grupo_id: Mapped[str] = mapped_column(String(50))
    descricao: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(50), default="")
    responsavel: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_ocorrencia: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class WscanIndenizacao(Base):
    __tablename__ = "wscan_indenizacoes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    grupo_id: Mapped[str] = mapped_column(String(50))
    descricao: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(50), default="")
    responsavel: Mapped[str | None] = mapped_column(String(100), nullable=True)
    valor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_solicitacao: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
