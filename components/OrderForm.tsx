'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPhoneNumber, getNextWeekDates, formatDate, getDayOfWeek } from '@/lib/utils'
import { Location, DailyCapacity, PaymentMethod } from '@/types'

interface OrderFormProps {
  onSubmit?: (data: {
    name: string
    contact: string
    location: Location
    orderDates: string[]
  }) => Promise<void>
  isAgreed?: boolean
}

export default function OrderForm({ onSubmit, isAgreed = false }: OrderFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [location, setLocation] = useState<Location | ''>('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [isWeeklyOrder, setIsWeeklyOrder] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [allergies, setAllergies] = useState('')
  const [capacities, setCapacities] = useState<Record<string, DailyCapacity>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const weekDates = getNextWeekDates()

  useEffect(() => {
    fetchCapacities()
    const interval = setInterval(fetchCapacities, 5000) // 5초마다 재고 갱신
    return () => clearInterval(interval)
  }, [])

  const fetchCapacities = async () => {
    try {
      const dateStrings = weekDates.map(formatDate)
      const response = await fetch(`/api/capacity?dates=${dateStrings.join(',')}`)
      
      if (!response.ok) {
        console.error('Error fetching capacities:', response.status)
        // 에러 발생 시 기본값 사용
        const capacityMap: Record<string, DailyCapacity> = {}
        dateStrings.forEach((dateStr) => {
          capacityMap[dateStr] = {
            id: '',
            date: dateStr,
            max_capa: 30,
            current_order_count: 0,
            is_closed: false,
            created_at: '',
            updated_at: '',
          }
        })
        setCapacities(capacityMap)
        return
      }

      const data = await response.json()
      const capacityMap: Record<string, DailyCapacity> = {}
      dateStrings.forEach((dateStr) => {
        const existing = data?.find((c: DailyCapacity) => c.date === dateStr)
        if (existing) {
          capacityMap[dateStr] = existing
        } else {
          // 기본값으로 생성
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
    } catch (error) {
      console.error('Error fetching capacities:', error)
      // 에러 발생 시 기본값 사용
      const dateStrings = weekDates.map(formatDate)
      const capacityMap: Record<string, DailyCapacity> = {}
      dateStrings.forEach((dateStr) => {
        capacityMap[dateStr] = {
          id: '',
          date: dateStr,
          max_capa: 30,
          current_order_count: 0,
          is_closed: false,
          created_at: '',
          updated_at: '',
        }
      })
      setCapacities(capacityMap)
    }
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setContact(formatted)
  }

  const toggleDate = (date: Date) => {
    const dateStr = formatDate(date)
    const capacity = capacities[dateStr]

    if (!capacity || capacity.is_closed || capacity.current_order_count >= capacity.max_capa) {
      return
    }

    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!contact.trim() || contact.replace(/\D/g, '').length < 10) {
      setError('올바른 연락처를 입력해주세요.')
      return
    }

    if (!location) {
      setError('수령 장소를 선택해주세요.')
      return
    }

    if (selectedDates.length === 0) {
      setError('최소 하나의 요일을 선택해주세요.')
      return
    }

    if (!paymentMethod) {
      setError('결제 방법을 선택해주세요.')
      return
    }

    if (!isAgreed) {
      setError('유의사항에 동의해주세요. 유의사항을 확인하고 체크박스를 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.replace(/\D/g, ''),
          location: location as Location,
          orderDates: selectedDates,
          payment_method: paymentMethod as PaymentMethod,
          allergies: allergies.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '주문 처리 중 오류가 발생했습니다.')
      }

      router.push('/order/success')
    } catch (err: any) {
      setError(err.message || '주문 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-card text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
          placeholder="홍길동"
          required
        />
      </div>

      <div>
        <label htmlFor="contact" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          연락처 <span className="text-red-500">*</span>
        </label>
        <input
          id="contact"
          type="tel"
          value={contact}
          onChange={handleContactChange}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
          placeholder="04XX XXX XXX"
          maxLength={13}
          required
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          수령 희망 장소 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(['Kings Park', 'Eastern Creek'] as Location[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              className={`px-4 py-3 min-h-[48px] rounded-card border-2 transition-all text-sm sm:text-base whitespace-nowrap ${
                location === loc
                  ? 'border-primary bg-primary-light text-primary font-medium'
                  : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
        {location && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {location === 'Kings Park' 
              ? '📍 프레임캐드 팀'
              : '📍 12시에 런치룸'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          수령 희망 요일 (잔여 도시락 수) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1.5 sm:gap-2">
          {weekDates.map((date) => {
            const dateStr = formatDate(date)
            const dayOfWeek = getDayOfWeek(date)
            const capacity = capacities[dateStr]
            const isSelected = selectedDates.includes(dateStr)
            const isAvailable =
              capacity &&
              !capacity.is_closed &&
              capacity.current_order_count < capacity.max_capa
            const remaining = capacity
              ? capacity.max_capa - capacity.current_order_count
              : 0
            const month = date.getMonth() + 1
            const day = date.getDate()
            const dateDisplay = `${month}/${day} (${dayOfWeek})`

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => toggleDate(date)}
                disabled={!isAvailable}
                className={`flex-1 px-1.5 sm:px-2 py-2 sm:py-2.5 min-h-[56px] sm:min-h-[60px] rounded-card border-2 transition-all text-xs sm:text-sm whitespace-nowrap flex flex-col items-center justify-center ${
                  !isAvailable
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : isSelected
                    ? 'border-primary bg-primary text-white font-medium'
                    : 'border-gray-300 bg-white text-gray-700 active:bg-primary-light'
                }`}
              >
                <div className="font-semibold text-xs sm:text-sm">{dateDisplay}</div>
                <div className="text-[9px] sm:text-[10px] mt-0.5">
                  {isAvailable ? (
                    <span className={isSelected ? 'text-white' : 'text-gray-500'}>
                      {remaining}개
                    </span>
                  ) : (
                    <span className="text-red-500">Sold Out</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isWeeklyOrder}
              onChange={(e) => setIsWeeklyOrder(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-xs sm:text-sm text-gray-700">
              매주 정기 주문하기
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          결제 방법 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] rounded-card border-2 transition-all text-sm sm:text-base ${
              paymentMethod === 'cash'
                ? 'border-primary bg-primary-light text-primary font-medium'
                : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50'
            }`}
          >
            캐쉬
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] rounded-card border-2 transition-all text-sm sm:text-base ${
              paymentMethod === 'bank_transfer'
                ? 'border-primary bg-primary-light text-primary font-medium'
                : 'border-gray-300 bg-white text-gray-700 active:bg-gray-50'
            }`}
          >
            계좌이체
          </button>
        </div>
        {paymentMethod === 'bank_transfer' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-card">
            <p className="text-xs sm:text-sm text-blue-900 font-medium mb-1">PayID</p>
            <p className="text-sm sm:text-base text-blue-800 font-semibold">0492 047 778</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="allergies" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          알러지 정보 <span className="text-gray-500 text-xs">(선택사항)</span>
        </label>
        <input
          id="allergies"
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
          placeholder="예: 견과류, 갑각류, 유제품 등"
        />
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
          특정 식재료에 알러지가 있으신 경우 기입해 주세요.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-primary hover:bg-primary-dark active:bg-primary-dark text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 min-h-[48px] sm:min-h-[52px] rounded-card shadow-card transition-all text-sm sm:text-base ${
          loading || !isAgreed ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? '처리 중...' : '주문하기'}
      </button>
      {!isAgreed && (
        <p className="text-xs sm:text-sm text-red-600 text-center mt-2">
          유의사항을 확인하고 동의해주세요.
        </p>
      )}
    </form>
  )
}
