import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  waiting: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const STATUS_LABELS = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  waiting: 'Pendente',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

export default function TicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [localNotes, setLocalNotes] = useState([])
  const [anotacoes, setAnotacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [adding, setAdding] = useState(false)
  const [activeTab, setActiveTab] = useState('messages')

  const [form, setForm] = useState({ cliente: '', titulo: '', modulo: '', assunto: '', descricao: '' })
  const [addingAnotacao, setAddingAnotacao] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [t, n, a] = await Promise.all([
        api.getTicket(id),
        api.getNotes(id),
        api.getAnotacoes(id),
      ])
      setTicket(t)
      setLocalNotes(n)
      setAnotacoes(a)

      const desc = t.description || ''
      setForm(prev => ({
        ...prev,
        cliente: prev.cliente || desc.match(/Client: (.+)/)?.[1] || '',
        modulo: prev.modulo || t.category || '',
      }))

      if (t.wscan_ocorrencia_id) {
        setMessagesLoading(true)
        try {
          const msgs = await api.getTicketMessages(id)
          setMessages(msgs)
        } catch (e) {
          console.error('Failed to load messages:', e)
        }
        setMessagesLoading(false)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    setAdding(true)
    try {
      await api.createNote({ ticket_id: id, content: noteText.trim(), author: 'web' })
      setNoteText('')
      const n = await api.getNotes(id)
      setLocalNotes(n)
    } catch (e) {
      alert('Erro ao adicionar nota: ' + e.message)
    }
    setAdding(false)
  }

  async function handleAddAnotacao() {
    if (!form.titulo.trim() || !form.assunto.trim()) {
      alert('Preencha titulo e assunto')
      return
    }
    setAddingAnotacao(true)
    try {
      await api.createAnotacao({ ticket_id: id, ...form })
      setForm(prev => ({ ...prev, titulo: '', assunto: '', descricao: '' }))
      const a = await api.getAnotacoes(id)
      setAnotacoes(a)
    } catch (e) {
      alert('Erro ao registrar atendimento: ' + e.message)
    }
    setAddingAnotacao(false)
  }

  async function handleDeleteAnotacao(anotacaoId) {
    if (!confirm('Excluir esta anotacao?')) return
    try {
      await api.deleteAnotacao(anotacaoId)
      setAnotacoes(prev => prev.filter(a => a.id !== anotacaoId))
    } catch (e) {
      alert('Erro ao excluir: ' + e.message)
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await api.updateTicket(id, { status: newStatus })
      setTicket({ ...ticket, status: newStatus })
    } catch (e) {
      alert('Erro ao atualizar: ' + e.message)
    }
  }

  if (loading) return <div className="py-8 text-center text-gray-500 dark:text-gray-400">Carregando...</div>
  if (!ticket) return <div className="py-8 text-center text-gray-500 dark:text-gray-400">Ticket nao encontrado</div>

  const desc = ticket.description || ''
  const client = desc.match(/Client: (.+)/)?.[1] || '-'
  const requester = desc.match(/Requester: (.+)/)?.[1] || '-'
  const system = desc.match(/System: (.+)/)?.[1] || '-'
  const group = desc.match(/Group: (.+)/)?.[1] || '-'

  const tabClass = (tab) =>
    `px-4 py-3 text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">&larr; Voltar</Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{ticket.wscan_grupo_id || ticket.id}</div>
            <h1 className="text-xl font-bold mt-1">{ticket.title}</h1>
            {ticket.wscan_ocorrencia_id && (
              <a
                href={`https://portaldocliente.praxio.com.br/Ticket/TicketPrincipal/${ticket.wscan_ocorrencia_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir no portal do cliente PRAXIO
              </a>
            )}
          </div>
          <span className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100 dark:bg-gray-700'}`}>
            {STATUS_LABELS[ticket.status] || ticket.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Cliente</div>
            <div className="font-medium">{client}</div>
          </div>
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Solicitante</div>
            <div className="font-medium">{requester}</div>
          </div>
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Responsavel</div>
            <div className="font-medium">{ticket.wscan_responsavel || '-'}</div>
          </div>
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Modulo</div>
            <div className="font-medium font-mono">{ticket.category}</div>
          </div>
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Sistema</div>
            <div className="font-medium">{system}</div>
          </div>
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Grupo</div>
            <div className="font-medium">{group}</div>
          </div>
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Abertura</div>
            <div className="font-medium">{ticket.created_at?.slice(0, 16).replace('T', ' ')}</div>
          </div>
          <div>
            <div className="text-gray-400 dark:text-gray-500 text-xs">Deadline</div>
            <div className="font-medium">{ticket.deadline?.slice(0, 16).replace('T', ' ') || 'N/A'}</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {['open', 'in_progress', 'waiting', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={ticket.status === s}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                ticket.status === s
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setActiveTab('messages')} className={tabClass('messages')}>
            Historico ({messages.length})
          </button>
          <button onClick={() => setActiveTab('notes')} className={tabClass('notes')}>
            Notas ({localNotes.length})
          </button>
          <button onClick={() => setActiveTab('anotacoes')} className={tabClass('anotacoes')}>
            Atendimentos ({anotacoes.length})
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {messagesLoading && <div className="text-center py-4 text-gray-400">Carregando historico do PRAXIO...</div>}
              {!messagesLoading && messages.length === 0 && (
                <div className="text-center py-4 text-gray-400 dark:text-gray-500">
                  {ticket.wscan_ocorrencia_id ? 'Nenhuma mensagem encontrada' : 'Ticket local - sem historico PRAXIO'}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-gray-500 dark:text-gray-400">{msg.date}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{msg.author}</span>
                    {msg.status && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                        {msg.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{msg.content}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {localNotes.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma nota</div>}
                {localNotes.map((n) => (
                  <div key={n.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 text-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                      {n.author} &middot; {n.created_at?.slice(0, 16).replace('T', ' ')}
                    </div>
                    <div>{n.content}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Adicionar nota..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
                <button
                  onClick={handleAddNote}
                  disabled={adding || !noteText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? '...' : 'Adicionar'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'anotacoes' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {anotacoes.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-sm">Nenhum atendimento registrado</div>}
                {anotacoes.map((a) => (
                  <div key={a.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                          {a.cliente || 'Sem cliente'}
                        </span>
                        {a.modulo && (
                          <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                            {a.modulo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                          {a.created_at?.slice(0, 16).replace('T', ' ')}
                        </span>
                        <button
                          onClick={() => handleDeleteAnotacao(a.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white mb-1">{a.titulo}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assunto: {a.assunto}</div>
                    {a.descricao && (
                      <div className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{a.descricao}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Novo Atendimento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente *</label>
                    <input
                      type="text"
                      value={form.cliente}
                      onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Modulo</label>
                    <input
                      type="text"
                      value={form.modulo}
                      onChange={(e) => setForm({ ...form, modulo: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Modulo do sistema"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Titulo *</label>
                    <input
                      type="text"
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Titulo do atendimento"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Assunto *</label>
                    <input
                      type="text"
                      value={form.assunto}
                      onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Assunto do chamado"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Descricao</label>
                    <textarea
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Descricao detalhada do atendimento..."
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleAddAnotacao}
                    disabled={addingAnotacao || !form.titulo.trim() || !form.assunto.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {addingAnotacao ? '...' : 'Registrar Atendimento'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
