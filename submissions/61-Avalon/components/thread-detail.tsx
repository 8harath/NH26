'use client'

import { ComprehensiveAnalysis, Thread } from '@/types'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'

interface ThreadDetailProps {
  thread: Thread
  analysis: ComprehensiveAnalysis | null
  loading: boolean
  error: string | null
  onAnalyze: () => Promise<void>
}

const priorityConfig: Record<ComprehensiveAnalysis['priority'], { label: string; color: string; dotColor: string }> = {
  urgent: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
  },
  important: {
    label: 'Important',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  normal: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  low: {
    label: 'Low',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  },
}

export function ThreadDetail({ thread, analysis, loading, error, onAnalyze }: ThreadDetailProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{thread.subject}</h1>
            <p className="text-sm text-gray-600">
              {thread.from.name} ({thread.from.email})
            </p>
          </div>
        </div>

        {/* AI Analysis Section */}
        {!analysis && !loading && !error && (
          <Button
            onClick={onAnalyze}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Analyze with AI
          </Button>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Spinner />
            Analyzing thread...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className={`p-4 border rounded-lg ${priorityConfig[analysis.priority].color}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${priorityConfig[analysis.priority].dotColor}`} />
                <span className="font-semibold">{priorityConfig[analysis.priority].label}</span>
              </div>
              <ul className="space-y-2">
                {analysis.summary.map((bullet, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="font-medium">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Email Thread */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {thread.emails.map((email, index) => (
            <div
              key={email.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{email.from.name}</p>
                  <p className="text-sm text-gray-600">{email.from.email}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(email.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {email.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
