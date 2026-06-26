from datetime import datetime

from pydantic import BaseModel, Field


class ProcedureCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    category: str = "general"
    steps: str = "[]"


class ProcedureUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    steps: str | None = None


class ProcedureResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    steps: str
    wscan_grupo_id: str | None
    wscan_status_raw: str | None
    wscan_responsavel: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
