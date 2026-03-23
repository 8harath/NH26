'use client'

import { useState } from 'react'
import {
  ReplyAction,
  CalendarAction,
  TaskAction,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Mail, Calendar, CheckSquare, X, RefreshCw, Check, ChevronDown, Copy } from 'lucide-react'

interface ActionCardsProps {
  actions: (ReplyAction | CalendarAction | TaskAction)[]
  onApprove: (actionId: string) => void
  onDiscard: (actionId: string) => void
  onRegenerate: (actionId: string) => void
  regeneratingId?: string
}

function ReplyActionCard({
  action,
  onApprove,
  onDiscard,
  onRegenerate,
  isRegenerating,
}: {
  action: ReplyAction
  onApprove: (id: string) => void
  onDiscard: (id: string) => void
  onRegenerate: (id: string) => void
  isRegenerating: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editedBody, setEditedBody] = useState(action.draftBody)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(editedBody).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Draft Reply</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-blue-200 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reply Body</label>
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onApprove(action.id)}
              variant="default"
              size="sm"
              disabled={isRegenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
            >
              <Copy className="w-4 h-4 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              onClick={() => onDiscard(action.id)}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
            >
              <X className="w-4 h-4 mr-1" />
              Discard
            </Button>
            <Button
              onClick={() => onRegenerate(action.id)}
              variant="ghost"
              size="sm"
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Spinner />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarActionCard({
  action,
  onApprove,
  onDiscard,
  onRegenerate,
  isRegenerating,
}: {
  action: CalendarAction
  onApprove: (id: string) => void
  onDiscard: (id: string) => void
  onRegenerate: (id: string) => void
  isRegenerating: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editedData, setEditedData] = useState({
    title: action.title,
    date: action.date,
    time: action.time,
    description: action.description,
  })

  return (
    <div className="border border-green-200 bg-green-50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">Create Calendar Event</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-green-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editedData.title}
                onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={editedData.date}
                onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={editedData.time}
              onChange={(e) => setEditedData({ ...editedData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editedData.description}
              onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onApprove(action.id)}
              variant="default"
              size="sm"
              disabled={isRegenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => onDiscard(action.id)}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
            >
              <X className="w-4 h-4 mr-1" />
              Discard
            </Button>
            <Button
              onClick={() => onRegenerate(action.id)}
              variant="ghost"
              size="sm"
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Spinner />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskActionCard({
  action,
  onApprove,
  onDiscard,
  onRegenerate,
  isRegenerating,
}: {
  action: TaskAction
  onApprove: (id: string) => void
  onDiscard: (id: string) => void
  onRegenerate: (id: string) => void
  isRegenerating: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editedData, setEditedData] = useState({
    title: action.title,
    description: action.description,
    dueDate: action.dueDate,
    priority: action.priority as 'low' | 'medium' | 'high',
  })

  return (
    <div className="border border-purple-200 bg-purple-50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900">Create Task</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-purple-200 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={editedData.title}
              onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editedData.description}
              onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={editedData.dueDate}
                onChange={(e) => setEditedData({ ...editedData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={editedData.priority}
                onChange={(e) => setEditedData({ ...editedData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onApprove(action.id)}
              variant="default"
              size="sm"
              disabled={isRegenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => onDiscard(action.id)}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
            >
              <X className="w-4 h-4 mr-1" />
              Discard
            </Button>
            <Button
              onClick={() => onRegenerate(action.id)}
              variant="ghost"
              size="sm"
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Spinner />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ActionCards({
  actions,
  onApprove,
  onDiscard,
  onRegenerate,
  regeneratingId,
}: ActionCardsProps) {
  if (actions.length === 0) {
    return null
  }

  return (
    <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-3">
      <h3 className="font-semibold text-gray-900">AI Suggested Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => {
          if (action.type === 'reply') {
            return (
              <ReplyActionCard
                key={action.id}
                action={action as ReplyAction}
                onApprove={onApprove}
                onDiscard={onDiscard}
                onRegenerate={onRegenerate}
                isRegenerating={regeneratingId === action.id}
              />
            )
          } else if (action.type === 'calendar') {
            return (
              <CalendarActionCard
                key={action.id}
                action={action as CalendarAction}
                onApprove={onApprove}
                onDiscard={onDiscard}
                onRegenerate={onRegenerate}
                isRegenerating={regeneratingId === action.id}
              />
            )
          } else {
            return (
              <TaskActionCard
                key={action.id}
                action={action as TaskAction}
                onApprove={onApprove}
                onDiscard={onDiscard}
                onRegenerate={onRegenerate}
                isRegenerating={regeneratingId === action.id}
              />
            )
          }
        })}
      </div>
    </div>
  )
}
