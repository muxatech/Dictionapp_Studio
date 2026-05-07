import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { ListsSkeleton } from '../components/Skeleton'
import { BookOpen, Lock } from 'lucide-react'

export default function Lists() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const subscriptionRef = useRef(null)

  // Check if subscription is considered "not active" for banner display
  const isSubscriptionInactive = subscription && (
    (subscription.status !== 'active' && subscription.status !== 'trialing') || 
    subscription.cancel_at
  )

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        // Get subscription status first
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('status, cancel_at')
          .eq('user_id', user.id)
          .single()
        
        if (subData) {
          setSubscription(subData)
          subscriptionRef.current = subData
        }

        // Fetch lists
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select('id, name, created_at, active')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (listsError) {
          console.error('Error loading lists:', listsError)
          setLoading(false)
          return
        }

        if (!listsData || listsData.length === 0) {
          setLists([])
          setLoading(false)
          return
        }

        // Fetch word counts, share codes, and subscriber counts
        const listIds = listsData.map(l => l.id)

        const { data: wordsData } = await supabase
          .from('list_words')
          .select('list_id')
          .in('list_id', listIds)

        const { data: codesData } = await supabase
          .from('share_codes')
          .select('list_id, code')
          .in('list_id', listIds)

        // Get subscriber counts
        const codesWithLists = codesData?.filter(c => c.code) || []
        let subscriberCountsMap = {}
        
        if (codesWithLists.length > 0) {
          const { data: subsData } = await supabase
            .from('list_subscriptions')
            .select('list_id')
            .in('list_id', codesWithLists.map(c => c.list_id))
          
          subsData?.forEach(sub => {
            subscriberCountsMap[sub.list_id] = (subscriberCountsMap[sub.list_id] || 0) + 1
          })
        }

        const wordsCountMap = {}
        wordsData?.forEach(w => {
          wordsCountMap[w.list_id] = (wordsCountMap[w.list_id] || 0) + 1
        })

        const codesMap = {}
        codesData?.forEach(c => {
          codesMap[c.list_id] = c.code
        })

        const formattedLists = listsData.map(list => ({
          ...list,
          words_count: wordsCountMap[list.id] || 0,
          code: codesMap[list.id] || null,
          subscribers_count: subscriberCountsMap[list.id] || 0
        }))

        setLists(formattedLists)
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up realtime subscription for list_subscriptions
    const channel = supabase
      .channel('list_subscriptions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'list_subscriptions',
      }, (payload) => {
        // Only update if the list belongs to the user
        setLists(prevLists => {
          const updatedLists = prevLists.map(list => {
            if (payload.new && payload.new.list_id === list.id) {
              const currentCount = list.subscribers_count || 0
              if (payload.eventType === 'INSERT') {
                return { ...list, subscribers_count: currentCount + 1 }
              } else if (payload.eventType === 'DELETE') {
                return { ...list, subscribers_count: Math.max(0, currentCount - 1) }
              }
            }
            return list
          })
          return updatedLists
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const { addToast } = useToast()

  const handleShare = async (code) => {
    if (code) {
      await navigator.clipboard.writeText(code)
      addToast('Código copiado al portapapeles', 'success')
    }
  }

  const handleDelete = async (listId, listName) => {
    if (!confirm(`¿Borrar "${listName}"? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id)
      if (error) throw error
      setLists(lists.filter(l => l.id !== listId))
      addToast('Lista eliminada correctamente', 'success')
    } catch (err) {
      console.error('Error deleting list:', err)
      addToast('Error al borrar la lista', 'error')
    }
  }

  return (
    <div className="dark:text-white">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Listas</h1>
        <button
          onClick={() => navigate('/create')}
          className="bg-accent text-primary px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
        >
          + Crear lista
        </button>
      </div>

      {isSubscriptionInactive && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">
            {subscription?.cancel_at 
              ? `Tu suscripción se cancelará el ${new Date(subscription.cancel_at).toLocaleDateString('es-ES')}. Las listas se desactivarán automáticamente.`
              : 'Tu suscripción no está activa. Por favor, suscríbete para acceder a tus listas.'
            }
            <button
              onClick={() => navigate(subscription?.cancel_at ? '/settings' : '/subscription')}
              className="ml-2 underline hover:no-underline text-red-800 dark:text-red-200"
            >
              {subscription?.cancel_at ? 'Ir a Ajustes' : 'Ir a Suscripción'}
            </button>
          </p>
        </div>
      )}

      {loading ? (
        <ListsSkeleton />
      ) : lists.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-4"><BookOpen size={48} className="mx-auto text-gray-400 dark:text-gray-500" /></div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No hay listas todavía</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Crea tu primera lista de vocabulario</p>
          <button
            onClick={() => navigate('/create')}
            className="inline-block bg-accent text-primary px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
          >
            Crear lista
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header - hidden on mobile */}
          <div className="hidden md:grid grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
            <div>Nombre</div>
            <div>Palabras</div>
            <div>Código</div>
            <div>Suscritos</div>
            <div>Fecha</div>
            <div>Acciones</div>
          </div>
          {lists.map(list => {
            const isInactive = subscription?.cancel_at && !list.active
            return (
            <div key={list.id} className={`${isInactive ? 'opacity-50' : ''}`}>
              {/* Desktop view */}
              <div className="hidden md:grid grid-cols-6 gap-4 p-4 border-b border-gray-100 dark:border-gray-700 items-center ${!isInactive ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'}">
                <button
                  onClick={() => !isInactive && navigate(`/list/${list.id}`)}
                  className={`font-medium text-left ${!isInactive ? 'text-gray-900 dark:text-white hover:text-accent' : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                >
                  {isInactive && <Lock size={16} className="inline mr-1" />}{list.name}
                </button>
                <div className="text-gray-600 dark:text-gray-300">{list.words_count}</div>
                <div className="text-gray-900 dark:text-white font-mono text-sm">
                  {list.code ? list.code : <span className="text-gray-400 dark:text-gray-500">-</span>}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {list.subscribers_count || '-'}
                </div>
                <div className="text-gray-600 dark:text-gray-300">{new Date(list.created_at).toLocaleDateString('es-ES')}</div>
                <div className="flex gap-2">
                  {!isInactive ? (
                    <>
                      <button
                        onClick={() => navigate(`/list/${list.id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Ver
                      </button>
                      {list.code && (
                        <button
                          onClick={() => handleShare(list.code)}
                          className="text-accent-dark hover:text-accent text-sm font-medium"
                        >
                          Compartir
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">Inactiva</span>
                  )}
                  <button
                    onClick={() => handleDelete(list.id, list.name)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Borrar
                  </button>
                </div>
              </div>

              {/* Mobile view */}
              <div className={`md:hidden p-4 border-b border-gray-100 dark:border-gray-700 ${!isInactive ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'} rounded-lg mb-2`}>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => !isInactive && navigate(`/list/${list.id}`)}
                    className={`font-medium text-left ${!isInactive ? 'text-gray-900 dark:text-white hover:text-accent' : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                  >
                    {isInactive && <Lock size={16} className="inline mr-1" />}{list.name}
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{list.words_count} palabras</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span className="font-mono">{list.code || '-'}</span>
                  <span>{list.subscribers_count || '0'} suscritos</span>
                  <span>{new Date(list.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex gap-2">
                  {!isInactive && (
                    <>
                      <button
                        onClick={() => navigate(`/list/${list.id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Ver
                      </button>
                      {list.code && (
                        <button
                          onClick={() => handleShare(list.code)}
                          className="text-accent-dark hover:text-accent text-sm font-medium"
                        >
                          Compartir
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(list.id, list.name)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}
