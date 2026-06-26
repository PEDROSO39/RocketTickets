import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

const STATUS_BADGES = {
  pendente: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
  enviado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
  erro: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
}

const STATUS_LABELS = {
  pendente: 'Pendente',
  enviado: 'Enviado',
  erro: 'Erro',
}

export default function RegistrarAtendimento() {
  const [form, setForm] = useState({
    cliente: '', titulo: '', assunto: '', modulo: '', descricao: '',
    client_code: '', system_code: '', module_id: '', contact_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [anotacoes, setAnotacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const [clients, setClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [systems, setSystems] = useState([])
  const [modules, setModules] = useState([])
  const [contacts, setContacts] = useState([])
  const clientRef = useRef(null)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    cliente: '', titulo: '', assunto: '', modulo: '', descricao: '',
    client_code: '', system_code: '', module_id: '', contact_id: '',
  })
  const [editClientSearch, setEditClientSearch] = useState('')
  const [editSystems, setEditSystems] = useState([])
  const [editModules, setEditModules] = useState([])
  const [editContacts, setEditContacts] = useState([])
  const [editClientDropdown, setEditClientDropdown] = useState(false)
  const editClientRef = useRef(null)

  useEffect(() => {
    loadAnotacoes()
    loadClients()
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleClickOutside(e) {
    if (clientRef.current && !clientRef.current.contains(e.target)) {
      setShowClientDropdown(false)
    }
    if (editClientRef.current && !editClientRef.current.contains(e.target)) {
      setEditClientDropdown(false)
    }
  }

  async function loadClients(search = '') {
    try {
      const data = await api.getClients(search)
      setClients(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function loadAnotacoes() {
    setLoading(true)
    try {
      const data = await api.getAnotacoesAvulsas()
      setAnotacoes(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function handleClientSearch(value) {
    setClientSearch(value)
    setShowClientDropdown(true)
    loadClients(value)
  }

  async function selectClient(client) {
    setForm(prev => ({
      ...prev,
      cliente: client.text,
      client_code: client.value,
      system_code: '',
      module_id: '',
      contact_id: '',
    }))
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
      console.error(e)
    }
  }

  async function handleSystemChange(systemCode) {
    setForm(prev => ({ ...prev, system_code: systemCode, module_id: '' }))
    setModules([])
    if (systemCode && form.client_code) {
      try {
        const mods = await api.getModules(form.client_code, systemCode)
        setModules(mods)
      } catch (e) {
        console.error(e)
      }
    }
  }

  async function handleSubmit() {
    if (!form.cliente.trim() || !form.titulo.trim()) {
      alert('Preencha cliente e titulo')
      return
    }
    setSaving(true)
    setSaved(false)
    try {
      await api.createAnotacao(form)
      setForm({
        cliente: '', titulo: '', assunto: '', modulo: '', descricao: '',
        client_code: '', system_code: '', module_id: '', contact_id: '',
      })
      setClientSearch('')
      setSystems([])
      setModules([])
      setContacts([])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      loadAnotacoes()
    } catch (e) {
      alert('Erro ao salvar: ' + e.message)
    }
    setSaving(false)
  }

  function startEdit(a) {
    setEditingId(a.id)
    setEditForm({
      cliente: a.cliente || '',
      titulo: a.titulo || '',
      assunto: a.assunto || '',
      modulo: a.modulo || '',
      descricao: a.descricao || '',
      client_code: a.client_code || '',
      system_code: a.system_code || '',
      module_id: a.module_id || '',
      contact_id: a.contact_id || '',
    })
    setEditClientSearch(a.cliente || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({
      cliente: '', titulo: '', assunto: '', modulo: '', descricao: '',
      client_code: '', system_code: '', module_id: '', contact_id: '',
    })
    setEditClientSearch('')
    setEditSystems([])
    setEditModules([])
    setEditContacts([])
  }

  async function handleEditClientSearch(value) {
    setEditClientSearch(value)
    setEditClientDropdown(true)
    try {
      const data = await api.getClients(value)
      setClients(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function selectEditClient(client) {
    setEditForm(prev => ({
      ...prev,
      cliente: client.text,
      client_code: client.value,
      system_code: '',
      module_id: '',
      contact_id: '',
    }))
    setEditClientSearch(client.text)
    setEditClientDropdown(false)
    setEditSystems([])
    setEditModules([])
    setEditContacts([])

    try {
      const [sys, cont] = await Promise.all([
        api.getSystems(client.value),
        api.getContacts(client.value),
      ])
      setEditSystems(sys)
      setEditContacts(cont)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleEditSystemChange(systemCode) {
    setEditForm(prev => ({ ...prev, system_code: systemCode, module_id: '' }))
    setEditModules([])
    if (systemCode && editForm.client_code) {
      try {
        const mods = await api.getModules(editForm.client_code, systemCode)
        setEditModules(mods)
      } catch (e) {
        console.error(e)
      }
    }
  }

  async function handleEditSubmit() {
    if (!editForm.cliente.trim() || !editForm.titulo.trim()) {
      alert('Preencha cliente e titulo')
      return
    }
    try {
      await api.updateAnotacao(editingId, editForm)
      cancelEdit()
      loadAnotacoes()
    } catch (e) {
      alert('Erro ao atualizar: ' + e.message)
    }
  }

  async function handleSync() {
    if (!confirm('Enviar todos os rascunhos pendentes para o PRAXIO?')) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await api.syncAnotacoes()
      setSyncResult(result)
      loadAnotacoes()
    } catch (e) {
      alert('Erro na sincronizacao: ' + e.message)
    }
    setSyncing(false)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este atendimento?')) return
    try {
      await api.deleteAnotacao(id)
      setAnotacoes(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      alert('Erro ao excluir: ' + e.message)
    }
  }

  const pendentes = anotacoes.filter(a => a.status === 'pendente').length

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Registrar Atendimento</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Preencha os dados do atendimento. O registro sera salvo localmente para processamento posterior.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div ref={clientRef} className="relative">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Cliente *
            </label>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => handleClientSearch(e.target.value)}
              onFocus={() => setShowClientDropdown(true)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Buscar cliente no PRAXIO..."
            />
            {showClientDropdown && clients.length > 0 && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                {clients.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => selectClient(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    {c.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Sistema
            </label>
            <select
              value={form.system_code}
              onChange={(e) => handleSystemChange(e.target.value)}
              disabled={!form.client_code}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors disabled:opacity-50"
            >
              <option value="">{form.client_code ? 'Selecione o sistema' : 'Selecione o cliente primeiro'}</option>
              {systems.map((s) => (
                <option key={s.value} value={s.value}>{s.text}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Modulo
            </label>
            <select
              value={form.module_id}
              onChange={(e) => setForm({ ...form, module_id: e.target.value })}
              disabled={!form.system_code}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors disabled:opacity-50"
            >
              <option value="">{form.system_code ? 'Selecione o modulo' : 'Selecione o sistema primeiro'}</option>
              {modules.map((m) => (
                <option key={m.value} value={m.value}>{m.text}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Contato
            </label>
            <select
              value={form.contact_id}
              onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
              disabled={!form.client_code}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors disabled:opacity-50"
            >
              <option value="">{form.client_code ? 'Selecione o contato' : 'Selecione o cliente primeiro'}</option>
              {contacts.map((c) => (
                <option key={c.value} value={c.value}>{c.text}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Titulo *
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Titulo do atendimento"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Assunto
            </label>
            <input
              type="text"
              value={form.assunto}
              onChange={(e) => setForm({ ...form, assunto: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Assunto (se vazio, usa o titulo)"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Descricao
            </label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-colors"
              placeholder="Descricao detalhada do atendimento..."
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving || !form.cliente.trim() || !form.titulo.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Registrar Atendimento'}
          </button>
          {saved && (
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">
              Atendimento registrado com sucesso!
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Rascunhos ({anotacoes.length})
          </h2>
          <button
            onClick={handleSync}
            disabled={syncing || pendentes === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {syncing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizar Rascunhos ({pendentes})
              </>
            )}
          </button>
        </div>

        {syncResult && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${syncResult.erros > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'}`}>
            {syncResult.enviados} enviado(s), {syncResult.erros} erro(s) de {syncResult.total} total
          </div>
        )}

        {loading && <div className="text-gray-400 text-sm">Carregando...</div>}
        {!loading && anotacoes.length === 0 && (
          <div className="text-gray-400 dark:text-gray-500 text-sm">Nenhum rascunho registrado</div>
        )}

        <div className="space-y-3">
          {anotacoes.map((a) => (
            <div key={a.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              {editingId === a.id ? (
                <div className="space-y-3">
                  <div ref={editClientRef} className="relative">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente</label>
                    <input
                      type="text"
                      value={editClientSearch}
                      onChange={(e) => handleEditClientSearch(e.target.value)}
                      onFocus={() => setEditClientDropdown(true)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {editClientDropdown && clients.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg">
                        {clients.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => selectEditClient(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-600"
                          >
                            {c.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sistema</label>
                      <select
                        value={editForm.system_code}
                        onChange={(e) => handleEditSystemChange(e.target.value)}
                        disabled={!editForm.client_code}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm disabled:opacity-50"
                      >
                        <option value="">Selecione</option>
                        {editSystems.map((s) => (
                          <option key={s.value} value={s.value}>{s.text}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Modulo</label>
                      <select
                        value={editForm.module_id}
                        onChange={(e) => setEditForm({ ...editForm, module_id: e.target.value })}
                        disabled={!editForm.system_code}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm disabled:opacity-50"
                      >
                        <option value="">Selecione</option>
                        {editModules.map((m) => (
                          <option key={m.value} value={m.value}>{m.text}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Titulo</label>
                    <input
                      type="text"
                      value={editForm.titulo}
                      onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Assunto</label>
                    <input
                      type="text"
                      value={editForm.assunto}
                      onChange={(e) => setEditForm({ ...editForm, assunto: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Se vazio, usa o titulo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Descricao</label>
                    <textarea
                      value={editForm.descricao}
                      onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSubmit}
                      disabled={!editForm.cliente.trim() || !editForm.titulo.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded text-xs font-medium">
                        {a.cliente || 'Sem cliente'}
                      </span>
                      {a.modulo && (
                        <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded text-xs">
                          {a.modulo}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded text-xs font-medium ${STATUS_BADGES[a.status] || STATUS_BADGES.pendente}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {a.created_at?.slice(0, 16).replace('T', ' ')}
                      </span>
                      {a.status !== 'pendente' && a.praxio_url && (
                        <a
                          href={a.praxio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                        >
                          Ver no PRAXIO
                        </a>
                      )}
                      {a.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => startEdit(a)}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white mb-1">{a.titulo}</div>
                  {a.descricao && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{a.descricao}</div>
                  )}
                  {a.status === 'erro' && a.error_message && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                      {a.error_message}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
