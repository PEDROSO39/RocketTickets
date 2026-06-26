import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function CreateTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    deadline: '',
    client: '',
    system: '',
    module: '',
    contact: '',
    origin: '3',
    groupType: '2',
  })
  const [saving, setSaving] = useState(false)
  const [praxioResult, setPraxioResult] = useState(null)

  const [clients, setClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientLoading, setClientLoading] = useState(false)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const clientRef = useRef(null)

  const [systems, setSystems] = useState([])
  const [modules, setModules] = useState([])
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    loadClients()
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleClickOutside(e) {
    if (clientRef.current && !clientRef.current.contains(e.target)) {
      setShowClientDropdown(false)
    }
  }

  async function loadClients(search = '') {
    setClientLoading(true)
    try {
      const data = await api.getClients(search)
      setClients(data)
    } catch (e) {
      console.error('Failed to load clients:', e)
    }
    setClientLoading(false)
  }

  function handleClientSearch(value) {
    setClientSearch(value)
    setShowClientDropdown(true)
    loadClients(value)
  }

  async function selectClient(client) {
    setForm({ ...form, client: client.value, system: '', module: '', contact: '' })
    setClientSearch(client.text)
    setShowClientDropdown(false)
    setSystems([])
    setModules([])
    setContacts([])

    try {
      const [sys, cont] = await Promise.all([
        api.getSystems(client.value),
        api.getContacts(client.value),
      ])
      setSystems(sys)
      setContacts(cont)
    } catch (e) {
      console.error('Failed to load client data:', e)
    }
  }

  async function handleSystemChange(systemCode) {
    setForm({ ...form, system: systemCode, module: '' })
    setModules([])
    if (systemCode && form.client) {
      try {
        const mods = await api.getModules(form.client, systemCode)
        setModules(mods)
      } catch (e) {
        console.error('Failed to load modules:', e)
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.client || !form.system || !form.module) {
      alert('Preencha titulo, cliente, sistema e modulo')
      return
    }
    setSaving(true)
    setPraxioResult(null)
    try {
      const result = await api.createPraxioTicket({
        client_code: form.client,
        system_code: form.system,
        module_id: form.module,
        subject: form.title,
        description: form.description,
        contact_id: form.contact,
        origin: form.origin,
        group_type: form.groupType,
      })
      setPraxioResult(result)
      if (result.success) {
        setTimeout(() => navigate('/'), 2000)
      }
    } catch (e) {
      alert('Erro ao criar ticket: ' + e.message)
    }
    setSaving(false)
  }

  const selectedClient = clients.find((c) => c.value === form.client)

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Novo Ticket no PRAXIO</h1>

      {praxioResult && (
        <div className={`mb-4 p-4 rounded-lg border ${praxioResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
          <div className={`font-medium ${praxioResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {praxioResult.success ? 'Ticket criado com sucesso!' : 'Erro ao criar ticket'}
          </div>
          <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">{praxioResult.message}</div>
          {praxioResult.ticket_id && (
            <a href={praxioResult.praxio_url} target="_blank" rel="noopener" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
              Abrir no PRAXIO &rarr;
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titulo *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            required
          />
        </div>

        <div ref={clientRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente *</label>
          {selectedClient && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{selectedClient.text}</span>
              <button type="button" onClick={() => { setForm({ ...form, client: '', system: '', module: '', contact: '' }); setClientSearch(''); setSystems([]); setModules([]); setContacts([]); }} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500">Limpar</button>
            </div>
          )}
          <input type="text" value={clientSearch} onChange={(e) => handleClientSearch(e.target.value)} onFocus={() => setShowClientDropdown(true)} placeholder="Buscar cliente..." className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          {showClientDropdown && clients.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {clientLoading && <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Carregando...</div>}
              {clients.slice(0, 50).map((c) => (
                <button key={c.value} type="button" onClick={() => selectClient(c)} className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 ${form.client === c.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}>
                  {c.text}
                </button>
              ))}
              {clients.length > 50 && <div className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 text-center">+{clients.length - 50} mais</div>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sistema *</label>
            <select value={form.system} onChange={(e) => handleSystemChange(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors" disabled={!form.client}>
              <option value="">{form.client ? 'Selecione...' : 'Selecione cliente primeiro'}</option>
              {systems.map((s) => <option key={s.value} value={s.value}>{s.text}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modulo *</label>
            <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors" disabled={!form.system}>
              <option value="">{form.system ? 'Selecione...' : 'Selecione sistema primeiro'}</option>
              {modules.map((m) => <option key={m.value} value={m.value}>{m.text}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contato</label>
            <select value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors" disabled={!form.client}>
              <option value="">Nenhum</option>
              {contacts.map((c) => <option key={c.value} value={c.value}>{c.text}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origem</label>
            <select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
              <option value="1">Telefone</option>
              <option value="2">E-mail</option>
              <option value="3">Ticket</option>
              <option value="5">Visita</option>
              <option value="6">WhatsApp</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descricao</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors" rows={3} />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving || !form.client || !form.system || !form.module} className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Criando no PRAXIO...' : 'Criar Ticket no PRAXIO'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
