# PRAX Backend

API REST para o sistema de workflow PRAXIO. FastAPI + SQLAlchemy + SQLite.

## Inicio Rapido

```bash
# Instalar dependencias
pip install -e ".[dev]"

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais PRAXIO

# Rodar migracoes
alembic upgrade head

# Iniciar servidor
uvicorn prax.main:app --reload
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Variaveis de Ambiente

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `PRAXIO_BASE_URL` | URL do portal PRAXIO | - |
| `PRAXIO_USERNAME` | Usuario PRAXIO | - |
| `PRAXIO_PASSWORD` | Senha PRAXIO | - |
| `DATABASE_URL` | URL do banco SQLite | `sqlite+aiosqlite:///./prax.db` |
| `CORS_ORIGINS` | Dominios permitidos (virgula) | `*` |
| `HOST` | Host do servidor | `0.0.0.0` |
| `PORT` | Porta do servidor | `8000` |

## Docker

```bash
docker-compose up -d
```

## Estrutura

```
backend/
├── prax/              # Package Python
│   ├── main.py        # App FastAPI
│   ├── config.py      # Settings
│   ├── database.py    # SQLAlchemy async
│   ├── models/        # Modelos ORM
│   ├── schemas/       # Pydantic schemas
│   ├── routers/       # Endpoints da API
│   ├── services/      # Logica de negocio
│   └── scraper/       # Web scraping PRAXIO
├── alembic/           # Migrations
├── tests/             # Testes
├── pyproject.toml     # Dependencias
├── Dockerfile
└── docker-compose.yml
```

## Testes

```bash
python -m pytest tests/
```
