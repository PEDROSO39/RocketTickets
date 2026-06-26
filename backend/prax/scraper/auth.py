import logging

import httpx
from bs4 import BeautifulSoup

from prax.config import settings
from prax.exceptions import ScraperAuthError

logger = logging.getLogger(__name__)


class PraxioAuth:
    """Handles login session management for the PRAXIO web portal."""

    def __init__(self):
        self.base_url = settings.praxio_base_url.rstrip("/")
        self.username = settings.praxio_username
        self.password = settings.praxio_password
        self._cookie_jar: dict[str, str] = {}
        self._authenticated = False

    async def login(self, client: httpx.AsyncClient) -> dict[str, str]:
        if self._authenticated and self._cookie_jar:
            return self._cookie_jar

        if not self.username or not self.password:
            raise ScraperAuthError(
                "PRAXIO credentials not configured",
                "Set PRAXIO_USERNAME and PRAXIO_PASSWORD in .env",
            )

        try:
            resp = await client.get(self.base_url)
            resp.raise_for_status()
        except httpx.HTTPError as e:
            raise ScraperAuthError("Failed to reach PRAXIO portal", str(e))

        soup = BeautifulSoup(resp.text, "lxml")
        form = soup.find("form")
        if not form:
            raise ScraperAuthError("Login form not found on PRAXIO page")

        action = form.get("action", "/Home/Entrar")
        if action.startswith("/"):
            action = f"{self.base_url}{action}"

        hidden_inputs = {
            inp["name"]: inp.get("value", "")
            for inp in form.find_all("input", {"type": "hidden"})
        }
        payload = {
            **hidden_inputs,
            "txtLogin": self.username,
            "txtSenha": self.password,
        }

        try:
            resp = await client.post(action, data=payload, follow_redirects=True)
            resp.raise_for_status()
        except httpx.HTTPError as e:
            raise ScraperAuthError("Login POST failed", str(e))

        if "logout" not in resp.text.lower() and self.username.lower() not in resp.text.lower():
            raise ScraperAuthError(
                "Login may have failed - no post-login indicators found",
                "Check credentials or portal URL",
            )

        self._cookie_jar = dict(client.cookies)
        self._authenticated = True
        logger.info("Successfully authenticated to PRAXIO")
        return self._cookie_jar


async def validate_credentials(username: str, password: str, base_url: str | None = None) -> bool:
    url = (base_url or settings.praxio_base_url).rstrip("/")
    if not username or not password:
        return False

    async with httpx.AsyncClient(timeout=30.0, verify=False, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except httpx.HTTPError:
            return False

        soup = BeautifulSoup(resp.text, "lxml")
        form = soup.find("form")
        if not form:
            return False

        action = form.get("action", "/Home/Entrar")
        if action.startswith("/"):
            action = f"{url}{action}"

        hidden_inputs = {
            inp["name"]: inp.get("value", "")
            for inp in form.find_all("input", {"type": "hidden"})
        }
        payload = {**hidden_inputs, "txtLogin": username, "txtSenha": password}

        try:
            resp = await client.post(action, data=payload, follow_redirects=True)
            resp.raise_for_status()
        except httpx.HTTPError:
            return False

        text = resp.text.lower()
        return "logout" in text or username.lower() in text
