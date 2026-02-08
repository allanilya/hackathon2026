import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'default' | 'lg'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-button transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeClasses = {
    default: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantClasses = {
    primary: 'bg-burnt-orange hover:bg-burnt-orange-hover text-white',
    secondary: 'bg-teal hover:bg-teal-hover text-white',
    outline: 'border-2 border-burnt-orange text-burnt-orange hover:bg-burnt-orange hover:text-white',
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
