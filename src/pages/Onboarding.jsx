import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon, ListTodo, Link, Smartphone } from 'lucide-react'

export default function Onboarding() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useAuth()

  const handleStart = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition text-gray-900 dark:text-white"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <img src="/logo.svg" alt="Dictionapp" className="h-24 w-24 mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-primary dark:text-accent mb-4">
            Dictionapp Studio
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            La plataforma definitiva para que tu academia gestione vocabulario y tus alumnos aprendan de forma interactiva.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl mb-4"><ListTodo size={48} className="mx-auto text-gray-600 dark:text-gray-300" /></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Crea listas de vocabulario
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Crea listas personalizadas con palabras, traducciones y descripciones. Soporta inglés, español, francés y alemán.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl mb-4"><Link size={48} className="mx-auto text-gray-600 dark:text-gray-300" /></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Comparte con un código
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Genera un código único para cada lista. Tus alumnos solo tienen que introducirlo en la app móvil para acceder.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl mb-4"><Smartphone size={48} className="mx-auto text-gray-600 dark:text-gray-300" /></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              App móvil integrada
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Los alumnos practican con la app móvil de Dictionapp. Tú solo te ocupas de crear el contenido.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            ¿Cómo funciona?
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Crea tu cuenta</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Regístrate con el email de tu academia y confirma tu cuenta.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Crea tus listas</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Añade palabras, traducciones y descripciones. Puedes añadir hasta 30 palabras rápidamente.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Genera el código</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Genera un código único y compártelo con tus alumnos.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Tus alumnos practican</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Los alumnos introducen el código en la app móvil y empiezan a practicar al instante.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleStart}
            className="bg-accent text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-dark transition-colors"
          >
            Comenzar ahora
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Suscripción mensual requerida para usar el portal
          </p>
        </div>
      </div>
    </div>
  )
}
