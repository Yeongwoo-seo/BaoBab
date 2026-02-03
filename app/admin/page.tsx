'use client'

import { useState, useEffect } from 'react'
import { WeeklySummary } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate, getNextWeekDates } from '@/lib/utils'

export default function AdminDashboard() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)

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
