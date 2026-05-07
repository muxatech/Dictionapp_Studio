import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon, Loader } from 'lucide-react'

export default function EmailConfirmed() {
  const { darkMode, toggleDarkMode } = useAuth()
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleEmailConfirmed = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          throw new Error('No se pudo verificar la sesión')
        }

        setVerifying(false)
      } catch (err) {
        setError(err.message || 'Error al verificar el email')
        setVerifying(false)
      }
    }

    handleEmailConfirmed()
  }, [navigate])

  const handleContinue = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (!error && data && (data.status === 'active' || data.status === 'trialing')) {
        navigate('/dashboard')
      } else {
        navigate('/subscription')
      }
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300">Verificando tu email...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition text-gray-900 dark:text-white"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
           <img src="/logo.svg" alt="Dictionapp Studio" className="h-20 w-20 mx-auto mb-4" />
             <h1 className="text-3xl font-bold text-primary dark:text-accent mb-4">¡Email confirmado!</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Tu cuenta ha sido verificada correctamente
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-accent/20 dark:bg-accent/10 border border-accent dark:border-accent/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Siguiente paso:</strong> Activa tu suscripción mensual para empezar a usar Dictionapp Portal.
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
            >
              Continuar a suscripción
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
