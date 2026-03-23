import { Mail } from 'lucide-react'

export function Logo({ size = 'default', dark = false }: { size?: 'sm' | 'default' | 'lg'; dark?: boolean }) {
  const config = {
    sm: { box: 'w-7 h-7', icon: 'w-3.5 h-3.5', text: 'text-base', radius: 'rounded-lg' },
    default: { box: 'w-9 h-9', icon: 'w-4.5 h-4.5', text: 'text-xl', radius: 'rounded-xl' },
    lg: { box: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-2xl', radius: 'rounded-2xl' },
  }[size]

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${config.box} ${config.radius} bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm`}>
        <Mail className={`${config.icon} text-white`} />
      </div>
      <span className={`${config.text} font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
        Mail<span className="text-blue-600">Mate</span>
      </span>
    </div>
  )
}
