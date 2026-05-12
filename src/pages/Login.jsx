import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { Sun, Moon, Check, Circle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({ length: false, hasUpperCase: false, hasNumber: false, hasSpecial: false })
  const navigate = useNavigate()
  const { login, darkMode, toggleDarkMode } = useAuth()

  useEffect(() => {
    if (isSignUp) {
      // Validar coincidencia
      if (confirmPassword && password !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden')
      } else {
        setPasswordError('')
      }

      // Validar complejidad en tiempo real
      setPasswordStrength({
        length: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      })
    } else {
      setPasswordError('')
      setPasswordStrength({ length: false, hasUpperCase: false, hasNumber: false, hasSpecial: false })
    }
  }, [password, confirmPassword, isSignUp])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden')
        }
        if (!passwordStrength.length || !passwordStrength.hasUpperCase || !passwordStrength.hasNumber || !passwordStrength.hasSpecial) {
          throw new Error('La contraseña no cumple con los requisitos mínimos')
        }
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmed`
          }
        })
        if (error) throw error
        if (data.user && !data.session) {
          setSuccess('Te hemos enviado un email de confirmación a ' + email + '. Revisa tu bandeja de entrada.')
          setIsSignUp(false)
          setPassword('')
          setConfirmPassword('')
        } else if (data.session) {
          navigate('/subscription')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.')
          }
          throw error
        }
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.message?.includes('User already registered')) {
        setError('Ya existe una cuenta con este email. Prueba a iniciar sesión o recupera tu contraseña.')
      } else {
        setError(err.message || 'Error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition text-gray-900 dark:text-white"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Dictionapp" className="h-20 w-20 mx-auto mb-4" />
           <h1 className="text-3xl font-bold text-primary dark:text-accent">Dictionapp Studio</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{isSignUp ? 'Crear cuenta' : 'Accede a tu academia'}</p>
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

          <div className="mb-4">
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="••••••"
              required
              minLength={8}
            />
              {isSignUp && (
              <div className="mt-2 space-y-1">
                <p className={`text-xs flex items-center gap-1 ${passwordStrength.length ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {passwordStrength.length ? <Check size={12} /> : <Circle size={12} />} Al menos 8 caracteres
                </p>
                <p className={`text-xs flex items-center gap-1 ${passwordStrength.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {passwordStrength.hasUpperCase ? <Check size={12} /> : <Circle size={12} />} Al menos una mayúscula
                </p>
                <p className={`text-xs flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {passwordStrength.hasNumber ? <Check size={12} /> : <Circle size={12} />} Al menos un número
                </p>
                <p className={`text-xs flex items-center gap-1 ${passwordStrength.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {passwordStrength.hasSpecial ? <Check size={12} /> : <Circle size={12} />} Al menos un carácter especial
                </p>
              </div>
            )}
          </div>

          {isSignUp && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none ${
                  passwordError 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
                placeholder="••••••"
                required
                minLength={6}
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-primary py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (isSignUp ? 'Crear cuenta' : 'Entrar')}
          </button>

          {!isSignUp && (
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="w-full mt-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
            className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm"
          >
            {isSignUp ? '¿Ya tienes cuenta? Entrar' : '¿No tienes cuenta? Regístrate'}
          </button>
        </form>
      </div>
    </div>
  )
}
