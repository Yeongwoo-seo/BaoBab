'use client'

import { useState, useEffect } from 'react'
import { DailyCapacity } from '@/types'
import { getNextWeekDates, formatDate, getDayOfWeek } from '@/lib/utils'

export default function AdminCapacityPage() {
  const [capacities, setCapacities] = useState<Record<string, DailyCapacity>>({})
  const [loading, setLoading] = useState(true)
  const weekDates = getNextWeekDates()

  useEffect(() => {
    fetchCapacities()
  }, [])

  const fetchCapacities = async () => {
    setLoading(true)
    try {
      const dateStrings = weekDates.map(formatDate)
      const response = await fetch(`/api/capacity?dates=${dateStrings.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        const capacityMap: Record<string, DailyCapacity> = {}
        dateStrings.forEach((dateStr) => {
          const existing = data?.find((c: DailyCapacity) => c.date === dateStr)
          if (existing) {
            capacityMap[dateStr] = existing
          } else {
            capacityMap[dateStr] = {
              id: '',
              date: dateStr,
              max_capa: 30,
              current_order_count: 0,
              is_closed: false,
              created_at: '',
              updated_at: '',
            }
          }
        })
        setCapacities(capacityMap)
      }
    } catch (error) {
      console.error('Error fetching capacities:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCapacity = async (date: string, field: 'max_capa' | 'is_closed', value: number | boolean) => {
    try {
      const capacity = capacities[date]
      const updateData: any = {
        date,
        [field]: value,
      }

      if (field === 'max_capa' && capacity) {
        updateData.max_capa = value
      } else if (field === 'is_closed') {
        updateData.is_closed = value
      }

      const response = await fetch('/api/capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        fetchCapacities()
      }
    } catch (error) {
      console.error('Error updating capacity:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">재고 설정</h1>
          <a
            href="/admin"
            className="px-4 py-2 text-gray-700 hover:text-primary active:text-primary transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center sm:justify-start"
          >
            ← 대시보드
          </a>
        </div>

        <div className="bg-white rounded-card shadow-card p-4 sm:p-6">
          {loading ? (
            <div className="text-center text-gray-600 py-8">로딩 중...</div>
          ) : (
            <div className="space-y-4">
              {weekDates.map((date) => {
                const dateStr = formatDate(date)
                const dayOfWeek = getDayOfWeek(date)
                const capacity = capacities[dateStr]

                return (
                  <div
                    key={dateStr}
                    className="border border-gray-200 rounded-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <span className="font-semibold text-gray-900 text-base">{dayOfWeek}</span>
                        <span className="text-sm text-gray-500">{dateStr}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        현재 주문: {capacity?.current_order_count || 0} / 최대 Capa: {capacity?.max_capa || 30}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700 whitespace-nowrap">Capa:</label>
                        <input
                          type="number"
                          value={capacity?.max_capa || 30}
                          onChange={(e) =>
                            updateCapacity(dateStr, 'max_capa', parseInt(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-2 min-h-[44px] border border-gray-300 rounded-card text-base"
                          min="0"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={capacity?.is_closed || false}
                          onChange={(e) => updateCapacity(dateStr, 'is_closed', e.target.checked)}
                          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">마감</span>
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
