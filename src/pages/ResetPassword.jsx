import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      })
      if (error) throw error
      setSuccess('Te hemos enviado un enlace de recuperación a ' + email + '. Revisa tu bandeja de entrada.')
      setEmail('')
    } catch (err) {
      setError(err.message || 'Error al enviar el enlace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Dictionapp" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary dark:text-accent">Recuperar contraseña</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Introduce tu email para recibir un enlace de recuperación</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="profesor@academia.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Volver al login
          </button>
        </form>
      </div>
    </div>
  )
}
