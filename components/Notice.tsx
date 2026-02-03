'use client'

import { useState, useEffect } from 'react'

interface Notice {
  id: string
  title: string
  content: string
  createdAt: string
  isActive: boolean
}

export default function Notice() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotice()
  }, [])

  const fetchNotice = async () => {
    try {
      const response = await fetch('/api/notices')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setNotice(data)
        }
      }
    } catch (error) {
      console.error('Error fetching notice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !notice) {
    return null
  }

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">{notice.title}</h3>
          <p className="text-xs sm:text-sm text-blue-800 whitespace-pre-line">{notice.content}</p>
        </div>
      </div>
    </div>
  )
}
