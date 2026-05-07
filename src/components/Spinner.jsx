export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-5 w-5 border-2',
    lg: 'h-6 w-6 border-3',
  }[size] || 'h-5 w-5 border-2'

  return (
    <div className={`animate-spin rounded-full border-t-transparent border-primary ${sizeClasses} ${className}`} />
  )
}
