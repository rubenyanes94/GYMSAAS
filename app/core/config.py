from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GYMSAAS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de Datos (Ajustado para el contenedor Docker)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "gymsaas_admin"
    POSTGRES_SERVER: str = "localhost" # Cambiar a 'db' si FastAPI corre dentro de Docker
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "gymsaas_db"
    
    @property
    def ASYNC_DATABASE_URI(self) -> str:
        # Usamos asyncpg para SQLAlchemy Async
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Seguridad y JWT
    SECRET_KEY: str = "super_secret_key_change_in_production" # Generar con: openssl rand -hex 32
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 días de sesión

    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()