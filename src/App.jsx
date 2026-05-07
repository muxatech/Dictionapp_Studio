import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './utils/supabase'
import { ToastProvider } from './contexts/ToastContext'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import UpdatePassword from './pages/UpdatePassword'
import EmailConfirmed from './pages/EmailConfirmed'
import Subscription from './pages/Subscription'
import Dashboard from './pages/Dashboard'
import Lists from './pages/Lists'
import CreateList from './pages/CreateList'
import ListDetail from './pages/ListDetail'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function SubscriptionWrapper() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">Cargando...</div>
  if (!user) return null

  return <Subscription />
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [hasSubscription, setHasSubscription] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) return
    
    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .single()
        
        if (!error && data && (data.status === 'active' || data.status === 'trialing')) {
          setHasSubscription(true)
        } else {
          setHasSubscription(false)
        }
      } catch (err) {
        setHasSubscription(false)
      } finally {
        setChecking(false)
      }
    }

    checkSubscription()
  }, [user])

  if (loading || checking) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (!hasSubscription) return <Navigate to="/subscription" />
  return children
}

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/email-confirmed" element={<EmailConfirmed />} />
        <Route path="/subscription" element={<SubscriptionWrapper />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="lists" element={<Lists />} />
          <Route path="create" element={<CreateList />} />
          <Route path="list/:id" element={<ListDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

export default App
