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
    jwt_secret: str = Field(
        default="change-me-in-production-this-is-not-secure",
        alias="NOMAD_JWT_SECRET",
    )
    jwt_algorithm: str = Field(default="HS256", alias="NOMAD_JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=60 * 24 * 30, alias="NOMAD_JWT_EXPIRE_MINUTES")

    model_config = SettingsConfigDict(populate_by_name=True)


settings = Settings()
