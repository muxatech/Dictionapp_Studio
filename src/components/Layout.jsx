import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, BookOpen, Plus, Settings, Sun, Moon, LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/lists', label: 'Listas', icon: BookOpen },
  { path: '/create', label: 'Crear lista', icon: Plus, highlight: true },
  { path: '/settings', label: 'Ajustes', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { logout, darkMode, toggleDarkMode } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary dark:text-accent">Dictionapp</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Studio</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.highlight
                  ? 'bg-accent text-primary hover:bg-accent-dark font-semibold'
                  : location.pathname === item.path
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between md:hidden">
          <h1 className="text-lg font-bold text-primary dark:text-accent">Dictionapp</h1>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-900 dark:text-white">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg mb-1 ${
                  item.highlight
                    ? 'bg-accent text-primary font-semibold'
                    : location.pathname === item.path
                    ? 'bg-gray-100 dark:bg-gray-800 text-primary dark:text-accent'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <item.icon size={20} className="inline mr-2" /> {item.label}
              </Link>
            ))}
            <button
              onClick={toggleDarkMode}
              className="w-full text-left px-4 py-3 rounded-lg mb-1 text-gray-700 dark:text-gray-300"
            >
              {darkMode ? <Sun size={20} className="inline mr-2" /> : <Moon size={20} className="inline mr-2" />} {darkMode ? 'Modo claro' : 'Modo oscuro'}
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg mb-1 text-gray-700 dark:text-gray-300"
            >
              <LogOut size={20} className="inline mr-2" /> Cerrar sesión
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-800">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
