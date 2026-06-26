# PRAX Frontend

Interface web React para o sistema de workflow PRAXIO.

## Inicio Rapido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

- Frontend: http://localhost:3000
- Proxy automatico para backend em http://localhost:8000

## Build para Producao

```bash
npm run build
```

O build e gerado em `dist/`.

## Deploy

### Vercel

1. Conectar repositorio no Vercel
2. Configurar variavel de ambiente `VITE_API_URL` com a URL do backend
3. Deploy automatico

### Netlify

1. Conectar repositorio no Netlify
2. Configurar variavel de ambiente `VITE_API_URL`
3. Build command: `npm run build`
4. Publish directory: `dist`

## Variaveis de Ambiente

| Variavel | Descricao |
|----------|-----------|
| `VITE_API_URL` | URL do backend API (vazio para proxy local) |

## Estrutura

```
frontend/
├── src/
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Layout + rotas
│   ├── api.js             # Cliente HTTP
│   ├── index.css          # Tailwind imports
│   └── components/
│       ├── TicketList.jsx         # Lista de tickets
│       ├── TicketDetail.jsx       # Detalhe do ticket
│       ├── SLADashboard.jsx       # Dashboard SLA
│       ├── CreateTicket.jsx       # Criar ticket
│       ├── RegistrarAtendimento.jsx # Registrar atendimento
│       ├── UserProfile.jsx        # Perfil do usuario
│       └── ThemeToggle.jsx        # Toggle dark/light
├── package.json
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

## Rotas

| Rota | Componente | Descricao |
|------|------------|-----------|
| `/` | TicketList | Lista de tickets |
| `/ticket/:id` | TicketDetail | Detalhe do ticket |
| `/sla` | SLADashboard | Dashboard SLA |
| `/new` | CreateTicket | Criar ticket |
| `/atendimento` | RegistrarAtendimento | Registrar atendimento |
| `/profile` | UserProfile | Perfil do usuario |
