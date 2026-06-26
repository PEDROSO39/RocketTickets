import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'waiting', label: 'Pendente cliente' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Concluido' },
]

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  waiting: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const ORIGIN_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'Telefone', label: 'Telefone' },
  { value: 'E-mail', label: 'E-mail' },
  { value: 'Ticket', label: 'Ticket' },
  { value: 'Visita', label: 'Visita' },
  { value: 'WhatsApp', label: 'WhatsApp' },
]

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState(null)

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    client: '',
    responsible: '',
    system: '',
    date_from: '',
    date_to: '',
  })

  useEffect(() => {
    loadTickets()
    loadSummary()
  }, [])

  async function loadTickets() {
    setLoading(true)
    try {
      const params = { limit: 500 }
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      if (filters.search) params.search = filters.search
      if (filters.client) params.client = filters.client
      if (filters.responsible) params.responsible = filters.responsible
      if (filters.system) params.system = filters.system
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      const data = await api.getTickets(params)
      setTickets(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function loadSummary() {
    try {
      const data = await api.getTicketSummaryByStatus()
      setSummary(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await api.syncTickets()
      await loadTickets()
      await loadSummary()
    } catch (e) {
      alert('Erro ao sincronizar: ' + e.message)
    }
    setSyncing(false)
  }

  function handleFilterChange(key, value) {
    setFilters({ ...filters, [key]: value })
  }

  function applyFilters() {
    loadTickets()
  }

  function clearFilters() {
    setFilters({
      search: '', status: '', priority: '', client: '',
      responsible: '', system: '', date_from: '', date_to: '',
    })
    setTimeout(loadTickets, 100)
  }

  function handleStatusClick(status) {
    setFilters({ ...filters, status: filters.status === status ? '' : status })
    setTimeout(loadTickets, 100)
  }

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== 'search').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Sincronizando...' : 'Sincronizar PRAXIO'}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUS_OPTIONS.filter(s => s.value).map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusClick(s.value)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                filters.status === s.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="text-2xl font-bold">{summary[s.value] || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por titulo, numero, cliente ou responsavel..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="flex-1 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || activeFilters > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
            {activeFilters > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{activeFilters}</span>
            )}
          </button>
          <button onClick={applyFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Buscar
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prioridade</label>
              <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm">
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cliente</label>
              <input type="text" value={filters.client} onChange={(e) => handleFilterChange('client', e.target.value)} placeholder="Ex: AMATUR" className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Responsavel</label>
              <input type="text" value={filters.responsible} onChange={(e) => handleFilterChange('responsible', e.target.value)} placeholder="Ex: PEDRO" className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sistema</label>
              <input type="text" value={filters.system} onChange={(e) => handleFilterChange('system', e.target.value)} placeholder="Ex: LUN" className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data inicial</label>
              <input type="date" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data final</label>
              <input type="date" value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 px-3 py-2">
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Numero</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Titulo</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Cliente</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Responsavel</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Modulo</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Abertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-2">
                    <Link to={`/ticket/${t.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs">
                      {t.wscan_grupo_id || '-'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">{t.title}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs">{t.description?.match(/Client: (.+)/)?.[1] || '-'}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400 text-xs">{t.wscan_responsavel || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100 dark:bg-gray-700'}`}>
                      {STATUS_OPTIONS.find(s => s.value === t.status)?.label || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{t.category}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{t.created_at?.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    Nenhum ticket encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-right">{tickets.length} tickets</div>
    </div>
  )
}
