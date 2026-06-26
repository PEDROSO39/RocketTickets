from datetime import datetime

from pydantic import BaseModel


class AnotacaoCreate(BaseModel):
    ticket_id: str | None = None
    cliente: str = ""
    titulo: str = ""
    assunto: str = ""
    modulo: str = ""
    descricao: str = ""
    client_code: str | None = None
    system_code: str | None = None
    module_id: str | None = None
    contact_id: str | None = None


class AnotacaoResponse(BaseModel):
    id: str
    ticket_id: str | None
    cliente: str
    titulo: str
    modulo: str
    assunto: str
    descricao: str
    created_at: datetime
    status: str
    client_code: str | None
    system_code: str | None
    module_id: str | None
    contact_id: str | None
    praxio_ticket_id: str | None
    praxio_url: str | None
    error_message: str | None

    model_config = {"from_attributes": True}
