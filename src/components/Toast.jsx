import { useState, useEffect } from 'react'
import { Check, X, Info } from 'lucide-react'

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible && !message) return null

  const bgColor = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  }[type] || 'bg-gray-50'

  const icon = {
    success: <Check size={20} className="text-green-500 dark:text-green-400" />,
    error: <X size={20} className="text-red-500 dark:text-red-400" />,
    info: <Info size={20} className="text-blue-500 dark:text-blue-400" />,
  }[type] || <Info size={20} className="text-blue-500 dark:text-blue-400" />

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColor}`}>
        {icon}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
          className="ml-2 hover:opacity-70 text-gray-600 dark:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
