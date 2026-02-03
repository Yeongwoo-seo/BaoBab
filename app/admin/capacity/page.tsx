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
    // daily_capacity 컬렉션을 사용하지 않으므로 업데이트 불가
    // max_capa는 고정값 30, is_closed는 별도 구현 필요
    console.warn('Capacity updates are not supported. Capacity is calculated from orders collection.')
    
    // is_closed 기능이 필요하면 별도 컬렉션(예: daily_settings)에 저장 필요
    if (field === 'is_closed') {
      // TODO: 별도 컬렉션에 is_closed 저장 구현 필요
      alert('마감 기능은 현재 지원되지 않습니다. 필요시 별도 구현이 필요합니다.')
    } else {
      alert('최대 Capa는 고정값 30입니다. 변경할 수 없습니다.')
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
          <div className="mb-4 flex justify-end">
            <button
              onClick={async () => {
                if (confirm('daily_capacity 컬렉션의 모든 데이터를 삭제하시겠습니까?\n\n이제 daily_capacity는 사용하지 않으므로 정리용입니다.')) {
                  try {
                    const response = await fetch('/api/admin/reset-capacity', {
                      method: 'POST',
                    })
                    const result = await response.json()
                    if (response.ok) {
                      alert(result.message)
                      fetchCapacities()
                    } else {
                      alert(`오류: ${result.error}`)
                    }
                  } catch (error) {
                    console.error('Error resetting capacity:', error)
                    alert('초기화 중 오류가 발생했습니다.')
                  }
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-card hover:bg-red-600 transition-colors text-sm"
            >
              daily_capacity 초기화
            </button>
          </div>
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
                          disabled
                          className="w-20 px-2 py-2 min-h-[44px] border border-gray-300 rounded-card text-base bg-gray-100 cursor-not-allowed"
                          min="0"
                          title="최대 Capa는 고정값 30입니다"
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
