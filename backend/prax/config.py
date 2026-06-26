from pydantic_settings import BaseSettings
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    praxio_base_url: str = "https://praxio.example.com"
    praxio_username: str = ""
    praxio_password: str = ""

    database_url: str = "sqlite+aiosqlite:///./prax.db"

    cors_origins: str = "*"

    host: str = "0.0.0.0"
    port: int = 8000

    sla_warning_hours: int = 24
    sla_critical_hours: int = 8
    sla_overdue_hours: int = 0

    sla_urgent_hours: int = 4
    sla_high_hours: int = 24
    sla_medium_hours: int = 72
    sla_low_hours: int = 168

    debug: bool = False

    model_config = {"env_file": str(ENV_FILE), "env_file_encoding": "utf-8"}

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
