import logging

import httpx

from prax.config import settings
from prax.exceptions import ScraperNetworkError
from prax.scraper.auth import PraxioAuth

logger = logging.getLogger(__name__)


class PraxioClient:
    """HTTP client for scraping PRAXIO web portal."""

    def __init__(self):
        self.base_url = settings.praxio_base_url.rstrip("/")
        self.auth = PraxioAuth()
        self._client: httpx.AsyncClient | None = None
        self._logged_in = False

    async def _ensure_client(self):
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0, verify=False, follow_redirects=True)
            self._logged_in = False
        if not self._logged_in:
            await self.auth.login(self._client)
            self._logged_in = True

    async def _get(self, path: str, params: dict = None):
        await self._ensure_client()
        url = f"{self.base_url}{path}"
        try:
            resp = await self._client.get(url, params=params)
            resp.raise_for_status()
            return resp
        except httpx.HTTPError as e:
            raise ScraperNetworkError(f"GET {url} failed", str(e))

    async def _get_json(self, path: str, params: dict = None):
        resp = await self._get(path, params)
        return resp.json()

    async def _post(self, path: str, data: dict = None):
        await self._ensure_client()
        url = f"{self.base_url}{path}"
        try:
            resp = await self._client.post(url, data=data)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise ScraperNetworkError(f"POST {url} failed", str(e))

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def fetch_tickets(self) -> list[dict]:
        from prax.scraper.tickets import parse_ticket_list
        try:
            resp = await self._get("/Ticket")
            return parse_ticket_list(resp.text)
        except ScraperNetworkError:
            logger.warning("Failed to fetch ticket list, returning empty")
            return []
        except Exception as e:
            from prax.exceptions import ScraperParseError
            raise ScraperParseError("Failed to parse ticket list", str(e))

    async def fetch_clients(self) -> list[dict]:
        try:
            data = await self._get_json("/Cliente/ConsultaClientes")
            return [{"value": c.get("Value", ""), "text": c.get("Text", "")} for c in data if c.get("Value")]
        except Exception as e:
            logger.warning(f"Failed to fetch clients: {e}")
            return []

    async def fetch_contacts(self, client_code: str) -> list[dict]:
        try:
            data = await self._get_json("/Contato/ConsultaContatoClientePorCliente", {"codCliente": client_code})
            return [{"value": c.get("Value", ""), "text": c.get("Text", "")} for c in data if c.get("Value")]
        except Exception as e:
            logger.warning(f"Failed to fetch contacts: {e}")
            return []

    async def fetch_systems(self, client_code: str) -> list[dict]:
        try:
            data = await self._get_json("/Sistema/ConsultaSistemaPorCliente", {"codCliente": client_code})
            return [{"value": c.get("Value", ""), "text": c.get("Text", "")} for c in data if c.get("Value")]
        except Exception as e:
            logger.warning(f"Failed to fetch systems: {e}")
            return []

    async def fetch_modules(self, client_code: str, system_code: str) -> list[dict]:
        try:
            data = await self._get_json("/Modulo/ConsultaModuloPorSistemaCliente", {
                "codSistema": system_code,
                "codCliente": client_code,
                "idOperador": "",
            })
            return [{"value": m.get("Value", ""), "text": m.get("Text", "")} for m in data if m.get("Value")]
        except Exception as e:
            logger.warning(f"Failed to fetch modules: {e}")
            return []

    async def fetch_operators(self, module_id: str, group_type: str = "2") -> list[dict]:
        try:
            data = await self._get_json("/Operador/ConsultaOperadoresPorModuloGrupo", {
                "idModulo": module_id,
                "grupoTipo": group_type,
            })
            return [{"value": o.get("Value", ""), "text": o.get("Text", "")} for o in data if o.get("Value")]
        except Exception as e:
            logger.warning(f"Failed to fetch operators: {e}")
            return []

    async def create_ticket(self, ticket_data: dict) -> dict:
        await self._get("/Ticket/NovoTicket")
        return await self._post("/Ticket/NovoTicket", data=ticket_data)

    async def fetch_ticket_messages(self, praxio_ticket_id: str) -> list[dict]:
        from prax.scraper.messages import parse_ticket_messages
        try:
            resp = await self._get(f"/Ticket/TicketPrincipal/{praxio_ticket_id}")
            return parse_ticket_messages(resp.text)
        except Exception as e:
            logger.warning(f"Failed to fetch ticket messages: {e}")
            return []

    async def fetch_user_profile(self) -> dict:
        from bs4 import BeautifulSoup
        try:
            resp = await self._get("/Operador/Detalhe")
            soup = BeautifulSoup(resp.text, "lxml")

            photo = ""
            img = soup.find("img", {"id": "imgOperadorLayout"})
            if img and img.get("src", "").startswith("data:image"):
                photo = img["src"]

            name = ""
            name_el = soup.find("span", {"id": "spanNomeAbreviado"})
            if name_el:
                name = name_el.get_text(strip=True)

            full_name = ""
            name_input = soup.find("input", {"id": "txtNome"})
            if name_input:
                full_name = name_input.get("value", "")

            email = ""
            email_input = soup.find("input", {"id": "txtEmail"})
            if email_input:
                email = email_input.get("value", "")

            phone = ""
            phone_input = soup.find("input", {"id": "txtTelefone"})
            if phone_input:
                phone = phone_input.get("value", "")

            return {
                "username": name,
                "full_name": full_name or name,
                "email": email,
                "phone": phone,
                "photo": photo,
            }
        except Exception as e:
            logger.warning(f"Failed to fetch user profile: {e}")
            return {"username": "", "full_name": "", "email": "", "phone": "", "photo": ""}
