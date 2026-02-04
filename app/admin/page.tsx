'use client'

import { useState, useEffect } from 'react'
import { WeeklySummary } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate, getNextWeekDates } from '@/lib/utils'

export default function AdminDashboard() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingWeeklyOrders, setUpdatingWeeklyOrders] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/admin/summary')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNextWeekToWeeklyOrders = async () => {
    if (!confirm('기존 정기 주문에 다음 주 날짜를 추가하시겠습니까?')) {
      return
    }

    setUpdatingWeeklyOrders(true)
    setUpdateMessage(null)

    try {
      const response = await fetch('/api/admin/add-next-week-to-weekly-orders', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setUpdateMessage(`성공: ${data.ordersUpdated}개 주문, ${data.customerOrdersUpdated}개 고객 주문 업데이트 완료`)
      } else {
        setUpdateMessage(`오류: ${data.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error: any) {
      console.error('Error updating weekly orders:', error)
      setUpdateMessage(`오류: ${error.message || '요청 중 오류가 발생했습니다.'}`)
    } finally {
      setUpdatingWeeklyOrders(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">관리자 대시보드</h1>

        {/* 주간 요약 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">이번 주 총 주문 건수</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary?.totalOrders || 0}건</p>
          </div>
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">예상 매출액</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              ${((summary?.expectedRevenue || 0) * 15).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">(개당 $15 기준)</p>
          </div>
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6 sm:col-span-2 md:col-span-1">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">금일 배송 수량</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary?.todayDelivery.total || 0}개</p>
          </div>
        </div>

        {/* 요일별 수요 그래프 */}
        <div className="bg-white rounded-card shadow-card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">요일별 주문량</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={summary?.ordersByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00D26A" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 금일 배송 상세 */}
        <div className="bg-white rounded-card shadow-card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">금일 배송 상세</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Kings Park</h3>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.todayDelivery.kingsPark || 0}개
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Eastern Creek</h3>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.todayDelivery.easternCreek || 0}개
              </p>
            </div>
          </div>
        </div>

        {/* 관리 도구 */}
        <div className="bg-white rounded-card shadow-card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">관리 도구</h2>
          <div className="space-y-3">
            <button
              onClick={handleAddNextWeekToWeeklyOrders}
              disabled={updatingWeeklyOrders}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-500 text-white font-semibold rounded-card hover:bg-blue-600 active:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center min-h-[44px] flex items-center justify-center"
            >
              {updatingWeeklyOrders ? '처리 중...' : '자동 오더 업데이트'}
            </button>
            {updateMessage && (
              <div className={`p-3 rounded-card text-sm ${
                updateMessage.includes('성공') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {updateMessage}
              </div>
            )}
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <a
            href="/admin/orders"
            className="px-4 sm:px-6 py-3 bg-primary text-white font-semibold rounded-card hover:bg-primary-dark active:bg-primary-dark transition-colors text-center min-h-[44px] flex items-center justify-center"
          >
            주문 관리
          </a>
          <a
            href="/admin/capacity"
            className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-card hover:bg-gray-300 active:bg-gray-300 transition-colors text-center min-h-[44px] flex items-center justify-center"
          >
            재고 설정
          </a>
          <a
            href="/admin/customers"
            className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-card hover:bg-gray-300 active:bg-gray-300 transition-colors text-center min-h-[44px] flex items-center justify-center"
          >
            고객 관리
          </a>
        </div>
      </div>
    </div>
  )
}
