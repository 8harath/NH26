'use client'

import { Thread } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface InboxListProps {
  threads: Thread[]
  selectedId: string | null
  onSelectThread: (threadId: string) => void
  searchQuery: string
}

const priorityColors = {
  urgent: 'bg-red-100 text-red-800',
  action: 'bg-amber-100 text-amber-800',
  fyi: 'bg-blue-100 text-blue-800',
}

export function InboxList({ threads, selectedId, onSelectThread, searchQuery }: InboxListProps) {
  const filteredThreads = threads.filter((thread) => {
    const query = searchQuery.toLowerCase()
    return (
      thread.subject.toLowerCase().includes(query) ||
      thread.from.name.toLowerCase().includes(query) ||
      thread.preview.toLowerCase().includes(query)
    )
  })

  return (
    <div className="border-r border-gray-200 bg-gray-50 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No threads found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-l-4 border-transparent',
                  selectedId === thread.id && 'bg-white border-l-blue-500 shadow-sm'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium text-sm', thread.unreadCount > 0 && 'font-bold')}>
                      {thread.from.name}
                    </p>
                  </div>
                  {thread.unreadCount > 0 && (
                    <Badge variant="default" className="bg-blue-600 text-white text-xs shrink-0">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{thread.subject}</p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">{thread.preview}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(thread.timestamp).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
