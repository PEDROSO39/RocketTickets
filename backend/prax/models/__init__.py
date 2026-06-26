from prax.models.ticket import Ticket, TicketStatus
from prax.models.note import Note
from prax.models.procedure import Procedure
from prax.models.sla import SLAConfig
from prax.models.anotacao import AnotacaoAtendimento
from prax.models.wscan import (
    WscanGrupoOcorrencia,
    WscanOcorrencia,
    WscanIndenizacao,
)

__all__ = [
    "Ticket",
    "TicketStatus",
    "Note",
    "Procedure",
    "SLAConfig",
    "AnotacaoAtendimento",
    "WscanGrupoOcorrencia",
    "WscanOcorrencia",
    "WscanIndenizacao",
]
