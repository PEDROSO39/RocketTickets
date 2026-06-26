# PRAX Desktop

Aplicacao desktop para o sistema de workflow PRAXIO. Tkinter + pywebview.

## Inicio Rapido

```bash
# Instalar dependencias do backend primeiro
cd ../backend
pip install -e ".[dev]"
cd ../desktop

# Instalar dependencias desktop
pip install pywebview Pillow

# Iniciar aplicacao
python launcher.py
```

## Funcionamento

1. Tela de login Tkinter abre
2. Credenciais validadas no portal PRAXIO
3. Backend FastAPI inicia em background
4. Janela pywebview abre com a interface web

## Build do Executavel

```bash
# Garantir que o frontend foi buildado
cd ../frontend && npm run build && cd ../desktop

# Gerar executavel
pyinstaller prax.spec
```

O executavel `.exe` sera gerado em `dist/PRAX/`.

## Estrutura

```
desktop/
├── launcher.py         # Entry point principal
├── login.py            # Tela de login Tkinter
├── auth.py             # Autenticacao local (SQLite)
├── reset_password.py   # Reset de senha via CLI
├── prax.spec           # Config PyInstaller
└── assets/             # Icones do app
    ├── icon_login.ico
    └── icon_login.png
```

## Requisitos

- Python 3.11+
- pywebview
- Pillow
- Backend PRAX configurado (veja `../backend/`)
