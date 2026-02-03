'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Order } from '@/types'
import { formatPhoneNumber, getDayOfWeek } from '@/lib/utils'

export default function MyOrdersPage() {
  const [contact, setContact] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setContact(formatted)
  }

  const handleSearch = async () => {
    if (!contact.trim()) {
      setError('연락처를 입력해주세요.')
      return
    }

    if (contact.replace(/\D/g, '').length < 10) {
      setError('올바른 연락처를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const response = await fetch(`/api/orders?contact=${contact.replace(/\D/g, '')}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '주문 내역을 불러오는 중 오류가 발생했습니다.')
      }
      
      setOrders(data || [])
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || '주문 내역을 불러오는 중 오류가 발생했습니다.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('정말 이 주문을 취소하시겠습니까?\n\n취소된 주문은 복구할 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '주문 취소 중 오류가 발생했습니다.')
      }

      // 주문 목록에서 제거
      setOrders(orders.filter(order => order.id !== orderId))
      alert('주문이 취소되었습니다.')
    } catch (err: any) {
      console.error('Error canceling order:', err)
      alert(err.message || '주문 취소 중 오류가 발생했습니다.')
    }
  }

  const formatOrderDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = getDayOfWeek(date)
    return `${month}/${day} (${dayOfWeek})`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}.${month}.${day} ${hours}:${minutes}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-card shadow-card p-4 sm:p-6 md:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">내 주문 조회</h2>
          
          <div className="mb-6">
            <label htmlFor="contact" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              연락처로 주문 내역 조회
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="contact"
                type="tel"
                value={contact}
                onChange={handleContactChange}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                placeholder="04XX XXX XXX"
                maxLength={13}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-primary text-white font-semibold rounded-card hover:bg-primary-dark active:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? '조회 중...' : '조회'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs sm:text-sm text-red-600">{error}</p>
            )}
          </div>

          {hasSearched && !loading && orders.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-gray-500">주문 내역이 없습니다.</p>
            </div>
          )}

          {orders.length > 0 && (
            <>
              <div className="mb-4 text-xs sm:text-sm text-gray-600">
                총 {orders.length}건의 주문 내역이 있습니다.
              </div>

              {/* 모바일: 카드 형태 */}
              <div className="block sm:hidden space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-card p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {formatDateTime(order.created_at)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{order.location}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5">수령 희망 요일</p>
                      <div className="flex flex-wrap gap-1.5">
                        {order.settlements?.map((settlement) => (
                          <span
                            key={settlement.date}
                            className="inline-block px-2 py-1 bg-gray-50 text-gray-700 rounded text-[10px] sm:text-xs"
                          >
                            {formatOrderDate(settlement.date)}
                          </span>
                        ))}
                      </div>
                    </div>
                    {order.allergies && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">알러지 정보</p>
                        <p className="text-xs sm:text-sm text-gray-700">{order.allergies}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-card transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 데스크톱: 테이블 형태 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문일시</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수령장소</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수령 희망 요일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">알러지 정보</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-gray-900">{order.location}</td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1.5">
                            {order.settlements?.map((settlement) => (
                              <span
                                key={settlement.date}
                                className="inline-block px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs"
                              >
                                {formatOrderDate(settlement.date)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm text-gray-900">
                          {order.allergies || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-card transition-colors"
                          >
                            취소
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
