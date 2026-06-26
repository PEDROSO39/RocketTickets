const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Request failed')
    }
    if (res.status === 204) return null
    return res.json()
  } catch (e) {
    clearTimeout(timeout)
    if (e.name === 'AbortError') {
      throw new Error('Requisicao expirou (timeout 120s)')
    }
    throw e
  }
}

export const api = {
  getTickets: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/api/tickets${q ? '?' + q : ''}`)
  },
  getTicket: (id) => request(`/api/tickets/${id}`),
  getTicketMessages: (id) => request(`/api/tickets/${id}/messages`),
  createTicket: (data) => request('/api/tickets', { method: 'POST', body: JSON.stringify(data) }),
  createPraxioTicket: (data) => request('/api/tickets/praxio', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id, data) => request(`/api/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTicket: (id) => request(`/api/tickets/${id}`, { method: 'DELETE' }),

  getNotes: (ticketId) => request(`/api/notes?ticket_id=${ticketId}`),
  createNote: (data) => request('/api/notes', { method: 'POST', body: JSON.stringify(data) }),
  deleteNote: (id) => request(`/api/notes/${id}`, { method: 'DELETE' }),

  getProcedures: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/api/procedures${q ? '?' + q : ''}`)
  },
  createProcedure: (data) => request('/api/procedures', { method: 'POST', body: JSON.stringify(data) }),

  getSLAStatus: () => request('/api/sla/status'),
  getSLASummary: () => request('/api/sla/summary'),

  syncTickets: () => request('/api/sync/run', { method: 'POST' }),

  getTicketSummaryByStatus: () => request('/api/tickets/summary/by-status'),
  getTicketSummaryByCategory: () => request('/api/tickets/summary/by-category'),

  getClients: (search = '') => request(`/api/clients?search=${encodeURIComponent(search)}`),
  refreshClients: () => request('/api/clients/refresh', { method: 'POST' }),
  getContacts: (clientCode) => request(`/api/clients/contacts/${clientCode}`),
  getSystems: (clientCode) => request(`/api/clients/systems/${clientCode}`),
  getModules: (clientCode, systemCode) => request(`/api/clients/modules/${clientCode}/${systemCode}`),
  getOperators: (moduleId, groupType = '2') => request(`/api/clients/operators/${moduleId}?group_type=${groupType}`),

  getUserProfile: () => request('/api/user/profile'),

  getAnotacoes: (ticketId) => request(`/api/anotacoes?ticket_id=${ticketId}`),
  getAnotacoesAvulsas: () => request('/api/anotacoes'),
  createAnotacao: (data) => request('/api/anotacoes', { method: 'POST', body: JSON.stringify(data) }),
  updateAnotacao: (id, data) => request(`/api/anotacoes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAnotacao: (id) => request(`/api/anotacoes/${id}`, { method: 'DELETE' }),
  syncAnotacoes: () => request('/api/anotacoes/sync', { method: 'POST' }),
}
