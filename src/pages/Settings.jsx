import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Spinner } from '../components/Spinner'
import { Sun, Moon, RefreshCw, User, LogOut } from 'lucide-react'

const PRICE_ID = 'price_1TTc8aB7Uuo9yIPdnUZ7bWRg'

export default function Settings() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth()
  const navigate = useNavigate()
  const [academyName, setAcademyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [canceling, setCanceling] = useState(false)

  const { addToast } = useToast()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    // Get academy name from user metadata
    setAcademyName(user.user_metadata?.academy_name || '')

    // Get subscription status
    const fetchSubscription = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setSubscription(data)
      }
    }

    fetchSubscription()
  }, [user, navigate])

  const handleCancelSubscription = async (action) => {
    if (!subscription?.stripe_subscription_id) {
      addToast('No se encontró la suscripción', 'error')
      return
    }

    if (action === 'cancel') {
      if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción? Seguirás teniendo acceso hasta el final del periodo actual.')) {
        return
      }
    } else if (action === 'reactivate') {
      if (!confirm('¿Quieres reactivar tu suscripción? Se eliminará la cancelación programada.')) {
        return
      }
    }

    setCanceling(true)
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { 
          subscriptionId: subscription.stripe_subscription_id,
          action: action
        }
      })

      if (error) throw error

      if (action === 'cancel') {
        addToast('Suscripción cancelada correctamente. Tendrás acceso hasta el final del periodo actual.', 'success')
        // Update local state with cancel_at
        const cancelAt = new Date()
        cancelAt.setMonth(cancelAt.getMonth() + 1) // Approximate, webhook will update exact date
        setSubscription({ ...subscription, cancel_at: cancelAt.toISOString() })
      } else {
        addToast('¡Suscripción reactivada correctamente!', 'success')
        setSubscription({ ...subscription, cancel_at: null })
      }
    } catch (err) {
      addToast('Error: ' + err.message, 'error')
    } finally {
      setCanceling(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { academy_name: academyName }
      })
      
      if (error) throw error
      
      // Save to localStorage so Dashboard can read it
      localStorage.setItem('academyName', academyName)
      
      addToast('¡Guardado correctamente!', 'success')
    } catch (err) {
      addToast('Error: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ajustes</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition text-gray-900 dark:text-white"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-accent-dark hover:text-accent"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Configuración de la Academia
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Academia
              </label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                placeholder="Ej: Dictionapp Academy"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-primary px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <><Spinner size="sm" /> Guardando...</> : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Suscripción
            </h3>
            {subscription && (subscription.status === 'active' || subscription.status === 'trialing') && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="font-medium">Estado:</span> {subscription.status === 'active' ? 'Activa' : 'En periodo de prueba'}
                </p>
                
                {subscription.current_period_end && (
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <span className="font-medium">Próxima renovación:</span> {' '}
                    {new Date(subscription.current_period_end).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}

                {subscription.cancel_at && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <span className="font-medium">Se cancelará el:</span> {' '}
                    {new Date(subscription.cancel_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
                
                {!subscription.cancel_at ? (
                  <button
                    onClick={() => handleCancelSubscription('cancel')}
                    disabled={canceling}
                    className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {canceling ? 'Cancelando...' : 'Cancelar suscripción'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancelSubscription('reactivate')}
                    disabled={canceling}
                    className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {canceling ? 'Reactivando...' : <><RefreshCw size={16} /> Reactivar suscripción</>}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} /> Cuenta
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email}
              </span>
              <button
                onClick={async () => {
                  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    await logout()
                    navigate('/login')
                  }
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center gap-2"
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
