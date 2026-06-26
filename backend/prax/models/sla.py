from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from prax.database import Base


class SLAConfig(Base):
    __tablename__ = "sla_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(100), unique=True)
    warning_hours: Mapped[int] = mapped_column(Integer, default=24)
    critical_hours: Mapped[int] = mapped_column(Integer, default=8)
