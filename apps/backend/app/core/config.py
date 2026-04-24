from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = Field(default="development", alias="NOMAD_ENV")
    api_host: str = Field(default="0.0.0.0", alias="NOMAD_API_HOST")
    api_port: int = Field(default=8000, alias="NOMAD_API_PORT")
    database_url: str = Field(
        default="postgresql+psycopg://nomad:nomad@localhost:5432/nomad",
        alias="NOMAD_DATABASE_URL",
    )

    model_config = SettingsConfigDict(populate_by_name=True)


settings = Settings()
