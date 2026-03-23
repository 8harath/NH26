import { CheckCircle, AlertCircle, Info } from 'lucide-react'

interface NotificationProps {
  type: 'success' | 'error' | 'info'
  message: string
}

const config = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    text: 'text-green-800',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    text: 'text-red-800',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    text: 'text-blue-800',
  },
}

export function Notification({ type, message }: NotificationProps) {
  const Icon = config[type].icon

  return (
    <div className="fixed bottom-4 right-4 animate-in slide-in-from-bottom-4 duration-300 z-50">
      <div className={`border rounded-lg p-4 flex items-start gap-3 shadow-lg ${config[type].bg}`}>
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config[type].iconColor}`} />
        <p className={`text-sm font-medium ${config[type].text}`}>{message}</p>
      </div>
    </div>
  )
}
