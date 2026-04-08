from functools import cached_property

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment / backend/.env.

    The backend uses its own DB_* variables (TCP connection to localhost
    by default) rather than the libpq PG* vars, because in devbox PGHOST
    points at a unix-socket directory used by psql/initdb.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = ""
    db_name: str = "app"

    # Not load-bearing in dev: the Next.js frontend proxies /api/* to this
    # backend via `rewrites()`, so browser requests are same-origin and
    # never trigger CORS. Kept as a safety net for direct cross-origin
    # access (e.g. hitting :8000 from a different host).
    cors_origins: list[str] = []
    api_prefix: str = "/api"

    @field_validator("api_prefix")
    @classmethod
    def _prefix_must_start_with_slash(cls, v: str) -> str:
        if not v.startswith("/"):
            raise ValueError("api_prefix must start with '/'")
        return v.rstrip("/")

    @cached_property
    def database_url(self) -> str:
        auth = self.db_user if not self.db_password else f"{self.db_user}:{self.db_password}"
        return f"postgresql+psycopg://{auth}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()
