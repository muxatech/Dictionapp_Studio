import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon, Check } from 'lucide-react'

const PRICE_ID = 'price_1TTc8aB7Uuo9yIPdnUZ7bWRg'

export default function Subscription() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [priceInfo, setPriceInfo] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (!error && data) {
          setSubscription(data)
          if (data.status === 'active' || data.status === 'trialing') {
            navigate('/dashboard')
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchPrice = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-price', {
          body: { priceId: PRICE_ID }
        })
        if (!error && data) {
          setPriceInfo(data)
        }
      } catch (err) {
        console.error('Error fetching price:', err)
      }
    }

    fetchSubscription()
    fetchPrice()
  }, [user, navigate])

  const handleSubscribe = async () => {
    setProcessing(true)
    try {
      console.log('Invoking create-checkout-session with:', {
        priceId: PRICE_ID,
        userId: user.id
      })
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId: PRICE_ID,
          userId: user.id,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/subscription`
        }
      })
      
      console.log('Response:', { data, error })
      
      if (error) {
        console.error('Function error:', error)
        throw error
      }
      
      if (data?.url) {
        window.location.href = data.url
      } else if (data?.error) {
        throw new Error(data.error)
      } else {
        console.error('No URL returned:', data)
        throw new Error('No se recibió la URL de pago')
      }
    } catch (err) {
      alert('Error al procesar el pago: ' + err.message)
      setProcessing(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

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
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user?.email}
            </span>
            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="text-center mb-8">
            <img src="/logo.svg" alt="Dictionapp Studio" className="h-20 w-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary dark:text-accent">Suscripción Requerida</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Para usar Dictionapp Studio necesitas una suscripción activa
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {priceInfo?.productName || 'Plan Mensual'}
              </h2>
              <div className="mt-4">
                {priceInfo ? (
                  <>
                    <span className="text-5xl font-bold text-primary dark:text-accent">{priceInfo.amount}€</span>
                    <span className="text-gray-500">{priceInfo.interval || '/mes'}</span>
                  </>
                ) : (
                   <>
                      <span className="text-5xl font-bold text-primary dark:text-accent">Cargando...</span>
                   </>
                )}
             </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <Check size={20} className="text-green-500 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">Creación ilimitada de listas</span>
              </li>
              <li className="flex items-center gap-3">
                <Check size={20} className="text-green-500 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">Códigos de acceso para alumnos</span>
              </li>
              <li className="flex items-center gap-3">
                <Check size={20} className="text-green-500 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">Seguimiento en tiempo real</span>
              </li>
              <li className="flex items-center gap-3">
                <Check size={20} className="text-green-500 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">Soporte técnico</span>
              </li>
            </ul>

            {subscription?.status === 'past_due' && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                Tu suscripción está vencida. Por favor, actualiza tu pago.
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {processing ? 'Redirigiendo a Stripe...' : 
                priceInfo ? `Suscribirse ahora - ${priceInfo.amount}€${priceInfo.interval || '/mes'}` : 
                'Suscribirse ahora...'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Al suscribirte, aceptas nuestros términos de servicio. Puedes cancelar en cualquier momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
