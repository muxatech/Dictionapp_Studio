import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DashboardSkeleton } from '../components/Skeleton'
import { Sun, Moon, Settings, List, Plus, BookOpen, Users, GraduationCap, CheckCircle, Pencil } from 'lucide-react'

function AnimatedNumber({ value, duration = 1000 }) {
  const [display, setDisplay] = useState(0)
  
  useEffect(() => {
    let startTime
    let animationFrame
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setDisplay(Math.floor(eased * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplay(value)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])
  
  return <span>{display.toLocaleString()}</span>
}

export default function Dashboard() {
  const { user, darkMode, toggleDarkMode } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalWords: 0,
    totalLists: 0,
    totalSubscriptions: 0,
    uniqueSubscribers: 0,
    recentActivity: []
  })

  const getActivityIcon = (type) => {
    switch(type) {
      case 'list_created': return <BookOpen size={20} className="text-green-600 dark:text-green-400" />
      case 'subscription': return <Users size={20} className="text-purple-600 dark:text-purple-400" />
      case 'words_added': return <Pencil size={20} className="text-blue-600 dark:text-blue-400" />
      default: return <CheckCircle size={20} className="text-gray-600 dark:text-gray-400" />
    }
  }

  const getIconColorClass = (type) => {
    switch(type) {
      case 'list_created': return "text-green-600 dark:text-green-400"
      case 'subscription': return "text-purple-600 dark:text-purple-400"
      case 'words_added': return "text-blue-600 dark:text-blue-400"
      default: return "text-gray-600 dark:text-gray-400"
    }
  }
  const [loading, setLoading] = useState(true)
  const [academyName, setAcademyName] = useState('')

  useEffect(() => {
    if (!user) return

    // Always use user_metadata as source of truth
    const metadataName = user.user_metadata?.academy_name || ''
    setAcademyName(metadataName || 'Mi Academia')
    // Keep localStorage in sync
    if (metadataName) {
      localStorage.setItem('academyName', metadataName)
    } else {
      localStorage.removeItem('academyName')
    }

       // Reload academy name when window focuses (always from user_metadata)
       const handleFocus = () => {
         const metadataName = user.user_metadata?.academy_name || ''
         setAcademyName(metadataName || 'Mi Academia')
         if (metadataName) {
           localStorage.setItem('academyName', metadataName)
         } else {
           localStorage.removeItem('academyName')
         }
       }
    window.addEventListener('focus', handleFocus)

    const fetchStats = async () => {
      try {
        // Get user's lists
        const { data: listsData } = await supabase
          .from('lists')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const listIds = listsData?.map(l => l.id) || []

        // Total words across all lists (distinct)
        const { count: totalWords } = await supabase
          .from('list_words')
          .select('word', { count: 'exact', head: false })
          .in('list_id', listIds.length > 0 ? listIds : ['00000000-0000-0000-0000-000000000000'])

        // Total lists
        const totalLists = listsData?.length || 0

        // Total subscriptions to user's lists
        const { count: totalSubscriptions } = await supabase
          .from('list_subscriptions')
          .select('*', { count: 'exact', head: false })
          .in('list_id', listIds.length > 0 ? listIds : ['00000000-0000-0000-0000-000000000000'])

        // Unique subscribers (distinct user_id)
        const { data: uniqueSubsData } = await supabase
          .from('list_subscriptions')
          .select('user_id')
          .in('list_id', listIds.length > 0 ? listIds : ['00000000-0000-0000-0000-000000000000'])

        const uniqueSubscribers = new Set(uniqueSubsData?.map(s => s.user_id) || []).size

        // Fetch recent activity (last 10)
        const activities = []

        // 1. Recent list creations (last 5)
        if (listsData && listsData.length > 0) {
          listsData.slice(0, 5).forEach(list => {
            activities.push({
              type: 'list_created',
              date: list.created_at,
              message: `Lista "${list.name}" creada`,
              icon: <BookOpen size={20} />
            })
          })
        }

        // 2. Recent subscriptions (last 5)
        const { data: recentSubs } = await supabase
          .from('list_subscriptions')
          .select(`
            created_at,
            list_id,
            lists(name)
          `)
          .in('list_id', listIds.length > 0 ? listIds : ['00000000-0000-0000-0000-000000000000'])
          .order('created_at', { ascending: false })
          .limit(5)

        recentSubs?.forEach(sub => {
          activities.push({
            type: 'subscription',
            date: sub.created_at,
            icon: <Users size={20} />,
            message: `Nueva suscripción a "${sub.lists?.name || 'Lista'}"`
          })
        })

        // Sort all activities by date and take last 10
        activities.sort((a, b) => new Date(b.date) - new Date(a.date))
        const recentActivity = activities.slice(0, 10)

        setStats({
          totalWords: totalWords || 0,
          totalLists,
          totalSubscriptions: totalSubscriptions || 0,
          uniqueSubscribers,
          recentActivity
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  const statCards = [
    {
      title: 'Total de palabras',
      value: stats.totalWords,
      icon: <List size={24} className="text-blue-600 dark:text-blue-400" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Listas creadas',
      value: stats.totalLists,
      icon: <BookOpen size={24} className="text-green-600 dark:text-green-400" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Total suscripciones',
      value: stats.totalSubscriptions,
      icon: <Users size={24} className="text-purple-600 dark:text-purple-400" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Alumnos únicos',
      value: stats.uniqueSubscribers,
      icon: <GraduationCap size={24} className="text-orange-600 dark:text-orange-400" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header - Responsive */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{academyName || 'Mi Academia'}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Panel de control</p>
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <button
                  onClick={toggleDarkMode}
                  className="p-3 rounded-lg bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition"
                >
                  {darkMode ? <Sun size={20} className="text-gray-900 dark:text-white" /> : <Moon size={20} className="text-gray-900 dark:text-white" />}
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <Settings size={16} /> <span className="hidden md:inline">Ajustes</span>
                </button>
                <button
                  onClick={() => navigate('/lists')}
                  className="bg-accent text-primary px-4 py-3 md:px-6 rounded-lg font-semibold hover:bg-accent-dark transition-colors text-sm md:text-base flex items-center gap-2"
                >
                  <span className="hidden md:inline">Ver listas</span>
                  <span className="md:hidden">Listas</span>
                 </button>
               </div>
             </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{stat.icon}</span>
                    <span className={`text-xs font-medium ${stat.textColor} bg-opacity-10 px-2 py-1 rounded-full`}>
                      {stat.title}
                    </span>
                  </div>
                  <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    <AnimatedNumber value={stat.value} />
                  </div>
                </div>
              ))}
            </div>

             {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button
                  onClick={() => navigate('/create')}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow text-left group"
                >
                  <div className="mb-3 text-blue-600 dark:text-blue-400"><Plus size={24} className="text-3xl" /></div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Crear nueva lista
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Añade vocabulario para tus alumnos
                  </p>
                </button>

                <button
                   onClick={() => navigate('/lists')}
                   className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow text-left group"
                >
                  <div className="mb-3 text-green-600 dark:text-green-400"><BookOpen size={24} className="text-3xl" /></div>
                 <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                   Gestionar listas
                 </h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                   Edita, comparte o elimina listas
                 </p>
               </button>

                <button
                   onClick={() => navigate('/settings')}
                   className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow text-left group"
                 >
                  <div className="mb-3 text-orange-600 dark:text-orange-400"><Settings size={24} className="text-3xl" /></div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Configuración
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nombre de academia y más
                </p>
              </button>
            </div>

            {/* Recent Activity */}
             <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Actividad reciente
              </h2>
              {stats.recentActivity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No hay actividad reciente
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl flex items-center ${getIconColorClass(activity.type)}`}>{activity.icon}</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {activity.message}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(activity.date).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
