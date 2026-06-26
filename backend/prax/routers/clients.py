from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from prax.database import get_db
from prax.exceptions import http_500
from prax.scraper.client import PraxioClient

router = APIRouter(prefix="/api/clients", tags=["clients"])


class ClientOption(BaseModel):
    value: str
    text: str


_cache: list[ClientOption] | None = None


@router.get("", response_model=list[ClientOption])
async def list_clients(
    search: str = Query("", description="Filter by client name"),
    db: AsyncSession = Depends(get_db),
):
    global _cache
    if _cache is None:
        client = PraxioClient()
        try:
            data = await client.fetch_clients()
            _cache = [ClientOption(**c) for c in data]
        except Exception as e:
            raise http_500(f"Failed to fetch clients: {e}")

    if search:
        s = search.lower()
        return [c for c in _cache if s in c.text.lower()]

    return _cache


@router.post("/refresh")
async def refresh_clients():
    global _cache
    _cache = None
    client = PraxioClient()
    try:
        data = await client.fetch_clients()
        _cache = [ClientOption(**c) for c in data]
    except Exception as e:
        raise http_500(f"Failed to fetch clients: {e}")
    return {"count": len(_cache)}


@router.get("/contacts/{client_code}", response_model=list[ClientOption])
async def list_contacts(client_code: str):
    client = PraxioClient()
    try:
        data = await client.fetch_contacts(client_code)
        return [ClientOption(**c) for c in data]
    except Exception as e:
        raise http_500(f"Failed to fetch contacts: {e}")


@router.get("/systems/{client_code}", response_model=list[ClientOption])
async def list_systems(client_code: str):
    client = PraxioClient()
    try:
        data = await client.fetch_systems(client_code)
        return [ClientOption(**c) for c in data]
    except Exception as e:
        raise http_500(f"Failed to fetch systems: {e}")


@router.get("/modules/{client_code}/{system_code}", response_model=list[ClientOption])
async def list_modules(client_code: str, system_code: str):
    client = PraxioClient()
    try:
        data = await client.fetch_modules(client_code, system_code)
        return [ClientOption(**c) for c in data]
    except Exception as e:
        raise http_500(f"Failed to fetch modules: {e}")


@router.get("/operators/{module_id}", response_model=list[ClientOption])
async def list_operators(module_id: str, group_type: str = "2"):
    client = PraxioClient()
    try:
        data = await client.fetch_operators(module_id, group_type)
        return [ClientOption(**c) for c in data]
    except Exception as e:
        raise http_500(f"Failed to fetch operators: {e}")
