import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function UserProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getUserProfile()
      .then(setProfile)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">Carregando perfil...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">Erro ao carregar perfil: {error}</div>
      </div>
    )
  }

  const photo = profile?.photo || null
  const initials = (profile?.full_name || profile?.username || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">Meu Perfil</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-start gap-8">
            <div className="flex flex-col items-center gap-4">
              {photo ? (
                <img
                  src={photo}
                  alt="Foto do usuario"
                  className="w-24 h-24 rounded-full object-cover border-4 border-green-100 dark:border-green-900/40"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {profile?.full_name || profile?.username || 'Usuario'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {profile?.email || 'Sem email'}
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Informacoes Pessoais</h3>
                  <a
                    href={`${window.location.protocol}//${window.location.hostname}:8000/../..`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar no PRAXIO
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Nome Completo
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profile?.full_name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profile?.email || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Telefone
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profile?.phone || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Conta</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Usuario PRAXIO
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {profile?.username || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Conectado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
