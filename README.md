# PRAX - Workflow Portal

Sistema integrado ao portal PRAXIO para gestao de tickets, SLA, atendimentos e procedimentos.

## Estrutura

```
prax/
├── backend/       # API REST (FastAPI + SQLAlchemy)
├── frontend/      # Interface web (React + Vite + Tailwind)
├── desktop/       # App desktop (Tkinter + pywebview)
└── README.md      # Este arquivo
```

## Modos de Execucao

### 1. Desktop (completo)

App standalone com login nativo e janela desktop:

```bash
cd desktop
python launcher.py
```

### 2. Web (producao)

Backend e frontend separados, acessivel via navegador:

```bash
# Backend
cd backend
pip install -e .
uvicorn prax.main:app --host 0.0.0.0 --port 8000

# Frontend (desenvolvimento)
cd frontend
npm install
npm run dev
```

### 3. Docker

```bash
cd backend
docker-compose up -d
```

## Documentacao

| Pasta | Descricao | Link |
|-------|-----------|------|
| `backend/` | API REST, banco de dados, scraping | [backend/README.md](backend/README.md) |
| `frontend/` | Interface React | [frontend/README.md](frontend/README.md) |
| `desktop/` | App desktop | [desktop/README.md](desktop/README.md) |

## Variaveis de Ambiente

Copie `.env.example` para `.env` na pasta `backend/` e configure:

```bash
PRAXIO_BASE_URL=https://portaldocliente.praxio.com.br
PRAXIO_USERNAME=seu_usuario
PRAXIO_PASSWORD=sua_senha
```

## Stack Tecnica

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, SQLite
- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Desktop:** Tkinter, pywebview, PyInstaller
- **Scraper:** httpx, BeautifulSoup4
