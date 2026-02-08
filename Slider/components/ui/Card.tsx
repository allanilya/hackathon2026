interface CardProps {
  children: React.ReactNode
  theme?: 'light' | 'dark'
  className?: string
  hover?: boolean
}

export default function Card({
  children,
  theme = 'light',
  className = '',
  hover = false,
}: CardProps) {
  const baseClasses = 'rounded-card p-6 transition-shadow duration-200'

  const themeClasses = {
    light: 'bg-white border border-stone-200 shadow-card',
    dark: 'bg-stone-900 border border-stone-800 shadow-card',
  }

  const hoverClass = hover ? 'hover:shadow-card-hover' : ''

  return (
    <div className={`${baseClasses} ${themeClasses[theme]} ${hoverClass} ${className}`}>
      {children}
    </div>
  )
}
