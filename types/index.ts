export type Location = 'Kings Park' | 'Eastern Creek'
export type PaymentMethod = 'cash' | 'bank_transfer'
export type DayOfWeek = '월' | '화' | '수' | '목' | '금'

export interface DailyCapacity {
  id: string
  date: string
  max_capa: number
  current_order_count: number
  is_closed: boolean
  created_at: string
  updated_at: string
}

export interface OrderSettlement {
  date: string // 주문 날짜 (YYYY-MM-DD)
  is_settled: boolean // 정산 여부
}

export interface Order {
  id: string
  customer_name: string
  contact: string
  location: Location
  payment_method?: PaymentMethod
  allergies?: string
  settlements: OrderSettlement[] // 날짜별 정산 정보 배열 (필수)
  is_weekly_order?: boolean // 정기 주문 여부
  created_at: string
  updated_at: string
}

export interface CustomerOrder {
  order_id: string
  settlements: OrderSettlement[] // 날짜별 정산 정보
  is_weekly_order: boolean // 정기 주문 여부
  created_at: string
}

export interface Customer {
  id: string
  name: string
  contact: string
  location: Location | null
  total_orders: number
  is_blacklisted: boolean
  is_weekly_order?: boolean // 정기 주문 여부
  orders?: CustomerOrder[] // 주문 배열
  created_at: string
  updated_at: string
}

export interface OrderFormData {
  name: string
  contact: string
  location: Location
  orderDates: string[]
  payment_method?: PaymentMethod
  allergies?: string
  is_weekly_order?: boolean
}

export interface WeeklySummary {
  totalOrders: number
  expectedRevenue: number
  ordersByDay: { day: string; count: number }[]
  todayDelivery: {
    total: number
    kingsPark: number
    easternCreek: number
  }
}

