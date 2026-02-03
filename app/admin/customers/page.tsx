'use client'

import { useState, useEffect } from 'react'
import { Customer, Order } from '@/types'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer)
    try {
      const response = await fetch(`/api/orders?contact=${customer.contact}`)
      if (response.ok) {
        const data = await response.json()
        setCustomerOrders(data)
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
    }
  }

  const toggleBlacklist = async (customerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blacklisted: !currentStatus }),
      })

      if (response.ok) {
        fetchCustomers()
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer({ ...selectedCustomer, is_blacklisted: !currentStatus })
        }
      }
    } catch (error) {
      console.error('Error updating blacklist:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">고객 관리</h1>
          <a
            href="/admin"
            className="px-4 py-2 text-gray-700 hover:text-primary active:text-primary transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center sm:justify-start"
          >
            ← 대시보드
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 고객 리스트 */}
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">고객 목록</h2>
            {loading ? (
              <div className="text-center text-gray-600 py-8">로딩 중...</div>
            ) : (
              <div className="space-y-2">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerClick(customer)}
                    className={`p-3 sm:p-4 border rounded-card cursor-pointer transition-colors active:bg-gray-50 ${
                      selectedCustomer?.id === customer.id
                        ? 'border-primary bg-primary-light'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${customer.is_blacklisted ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{customer.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{customer.contact}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          총 주문: {customer.total_orders}건
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBlacklist(customer.id, customer.is_blacklisted)
                        }}
                        className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-card ${
                          customer.is_blacklisted
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {customer.is_blacklisted ? '블랙리스트 해제' : '블랙리스트'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 고객 상세 */}
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">주문 이력</h2>
            {selectedCustomer ? (
              <div>
                <div className="mb-4 pb-4 border-b">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedCustomer.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedCustomer.contact}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedCustomer.location}</p>
                </div>
                <div className="space-y-2">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="p-3 border border-gray-200 rounded-card">
                      <p className="text-xs sm:text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <p className="text-xs text-gray-600">{order.location}</p>
                      <p className="text-xs text-gray-500">
                        {order.settlements?.map((s) => s.date).join(', ') || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 text-sm">
                고객을 선택하여 주문 이력을 확인하세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
