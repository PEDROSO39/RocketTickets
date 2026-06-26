import { useState, useEffect } from 'react'
import { api } from '../api'

const STATUS_COLORS = {
  on_time: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-orange-500',
  overdue: 'bg-red-500',
  no_deadline: 'bg-gray-300 dark:bg-gray-600',
  completed: 'bg-blue-400',
}

const STATUS_LABELS = {
  on_time: 'No prazo',
  warning: 'Atencao',
  critical: 'Critico',
  overdue: 'Atrasado',
  no_deadline: 'Sem prazo',
  completed: 'Concluido',
}

export default function SLADashboard() {
  const [summary, setSummary] = useState(null)
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [s, st] = await Promise.all([api.getSLASummary(), api.getSLAStatus()])
      setSummary(s)
      setStatuses(st)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading) return <div className="py-8 text-center text-gray-500 dark:text-gray-400">Carregando...</div>

  const filtered = filter === 'all' ? statuses : statuses.filter((s) => s.sla_status === filter)
  const total = summary?.total || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard SLA</h1>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['on_time', 'warning', 'critical', 'overdue', 'no_deadline'].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`p-4 rounded-lg border text-center transition-colors ${
                filter === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${STATUS_COLORS[key]}`} />
              <div className="text-2xl font-bold">{summary[key] || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{STATUS_LABELS[key]}</div>
              {total > 0 && key !== 'no_deadline' && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {Math.round(((summary[key] || 0) / total) * 100)}%
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {summary?.by_priority && Object.keys(summary.by_priority).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-bold text-sm mb-3">Por Prioridade</h2>
          <div className="space-y-2">
            {Object.entries(summary.by_priority).map(([priority, counts]) => (
              <div key={priority} className="flex items-center gap-3 text-sm">
                <span className="w-20 font-medium">{priority}</span>
                <div className="flex-1 flex gap-1">
                  {Object.entries(counts).map(([status, count]) => (
                    <div
                      key={status}
                      className={`h-6 rounded ${STATUS_COLORS[status]}`}
                      style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, minWidth: count > 0 ? '20px' : '0' }}
                      title={`${STATUS_LABELS[status]}: ${count}`}
                    />
                  ))}
                </div>
                <span className="text-gray-400 dark:text-gray-500 text-xs w-12 text-right">
                  {Object.values(counts).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Status SLA</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Ticket</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Prioridade</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Horas Restantes</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Mensagem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((s) => (
              <tr key={s.ticket_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s.sla_status]}`} />
                    <span className="text-xs font-medium">{STATUS_LABELS[s.sla_status] || s.sla_status}</span>
                  </span>
                </td>
                <td className="px-4 py-2 max-w-xs truncate">{s.title}</td>
                <td className="px-4 py-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{s.priority}</span>
                </td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {s.hours_remaining != null ? `${s.hours_remaining}h` : '-'}
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs">{s.message}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  Nenhum ticket neste status
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 text-right">{filtered.length} tickets</div>
    </div>
  )
}
