import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ThemeToggle from './components/ThemeToggle'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import SLADashboard from './components/SLADashboard'
import CreateTicket from './components/CreateTicket'
import UserProfile from './components/UserProfile'
import RegistrarAtendimento from './components/RegistrarAtendimento'
import { api } from './api'

const nav = [
  { path: '/', label: 'Tickets' },
  { path: '/sla', label: 'SLA' },
  { path: '/new', label: 'Novo Ticket' },
  { path: '/atendimento', label: 'Registrar Atendimento' },
]

export default function App() {
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    api.getUserProfile()
      .then(setProfile)
      .catch(() => {})
  }, [])

  const initials = (profile?.full_name || profile?.username || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-blue-600 dark:text-blue-400">PRAX</Link>
          {nav.map((n) => (
            <Link
              key={n.path}
              to={n.path}
              className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                location.pathname === n.path
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {profile?.photo ? (
                  <img src={profile.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                  {profile?.full_name || profile?.username || 'User'}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile?.full_name || profile?.username || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {profile?.email || 'user@praxio.local'}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Meu Perfil
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<TicketList />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/sla" element={<SLADashboard />} />
          <Route path="/new" element={<CreateTicket />} />
          <Route path="/atendimento" element={<RegistrarAtendimento />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </main>
    </div>
  )
}
