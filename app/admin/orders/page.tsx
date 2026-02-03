'use client'

import { useState, useEffect } from 'react'
import { Order } from '@/types'
import { formatDate } from '@/lib/utils'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    location: '',
    paymentStatus: '',
  })

  // 현재 월의 시작일과 종료일 계산
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  // 월 변경 시 필터 자동 업데이트
  useEffect(() => {
    const range = getMonthRange(currentMonth)
    setFilters(prev => ({
      ...prev,
      startDate: range.start,
      endDate: range.end,
    }))
  }, [currentMonth])

  useEffect(() => {
    fetchOrders()
  }, [filters])

  // 이전 월로 이동
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  // 다음 월로 이동
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  // 현재 월로 이동
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.location) params.append('location', filters.location)
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettleDate = async (orderId: string, date: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error settling order:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">주문 관리</h1>
          <a
            href="/admin"
            className="px-3 py-2 text-gray-700 hover:text-primary active:text-primary transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center sm:justify-start"
          >
            ← 대시보드
          </a>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
          {/* 월 네비게이션 */}
          <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousMonth}
                className="px-2 sm:px-3 py-2 min-h-[44px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center touch-manipulation"
                aria-label="이전 월"
              >
                <span className="text-xl sm:text-2xl font-bold">&lt;</span>
              </button>
              <div className="flex-1 text-center px-2">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </h2>
                <button
                  onClick={goToCurrentMonth}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline touch-manipulation"
                >
                  오늘로 이동
                </button>
              </div>
              <button
                onClick={goToNextMonth}
                className="px-2 sm:px-3 py-2 min-h-[44px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center touch-manipulation"
                aria-label="다음 월"
              >
                <span className="text-xl sm:text-2xl font-bold">&gt;</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">종료일</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">장소</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg text-sm sm:text-base"
              >
                <option value="">전체</option>
                <option value="Kings Park">Kings Park</option>
                <option value="Eastern Creek">Eastern Creek</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">결제상태</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg text-sm sm:text-base"
              >
                <option value="">전체</option>
                <option value="pending">입금대기</option>
                <option value="completed">입금완료</option>
              </select>
            </div>
          </div>
        </div>

        {/* 주문 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 sm:p-8 text-center text-gray-600 text-sm sm:text-base">로딩 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">주문일시</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">고객명</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">연락처</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 whitespace-nowrap">수령장소</th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700">주문요일</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                        <br className="sm:hidden" />
                        <span className="text-gray-500 sm:ml-1">
                          {new Date(order.created_at).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{order.customer_name}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{order.contact}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">{order.location}</td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                        {order.settlements?.map((s) => formatDate(new Date(s.date))).join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">주문 내역이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
