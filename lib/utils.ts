import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(value: string): string {
  // 호주 전화번호 포맷: 04xx xxx xxx
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 4) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`
  return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 10)}`
}

export function getDayOfWeek(date: Date): '월' | '화' | '수' | '목' | '금' {
  const day = date.getDay()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[day] as '월' | '화' | '수' | '목' | '금'
}

/**
 * 날짜 문자열에서 요일 추출
 */
export function getDayOfWeekFromDate(dateStr: string): '월' | '화' | '수' | '목' | '금' | null {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) return null
    return getDayOfWeek(date)
  } catch {
    return null
  }
}

/**
 * 정기 주문에서 사용되는 요일들 추출
 */
export function getWeeklyOrderDays(orders: { settlements: { date: string }[], is_weekly_order: boolean }[]): Set<'월' | '화' | '수' | '목' | '금'> {
  const days = new Set<'월' | '화' | '수' | '목' | '금'>()
  
  orders.forEach(order => {
    if (order.is_weekly_order) {
      order.settlements.forEach(settlement => {
        const day = getDayOfWeekFromDate(settlement.date)
        if (day) {
          days.add(day)
        }
      })
    }
  })
  
  return days
}

export function getNextWeekDates(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  // 시간을 0시로 설정하여 날짜 계산 정확도 향상
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()
  
  // 다음 주 월요일부터 시작
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  nextMonday.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(nextMonday)
    date.setDate(nextMonday.getDate() + i)
    date.setHours(0, 0, 0, 0)
    dates.push(date)
  }
  
  return dates
}

export function formatDate(date: Date): string {
  // 로컬 시간대를 사용하여 날짜 포맷팅 (타임존 문제 방지)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDateFromDayOfWeek(dayOfWeek: '월' | '화' | '수' | '목' | '금'): Date {
  const today = new Date()
  const dayOfWeekMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 }
  const targetDay = dayOfWeekMap[dayOfWeek]
  const currentDay = today.getDay()
  
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + daysUntilTarget)
  
  return targetDate
}

/**
 * 선택된 날짜들의 요일을 기반으로 여러 주 앞의 같은 요일들의 날짜를 반환
 * @param selectedDates 선택된 날짜들
 * @param weeksAhead 몇 주 앞까지 생성할지 (기본값: 1주 = 다음 주)
 */
export function getWeeklyRecurringDates(selectedDates: string[], weeksAhead: number = 1): string[] {
  if (selectedDates.length === 0) return []
  
  const allDates: string[] = []
  
  // 선택된 날짜들부터 시작
  selectedDates.forEach((dateStr) => {
    // 날짜 문자열을 파싱 (YYYY-MM-DD 형식)
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day) // 월은 0부터 시작
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateStr}, skipping`)
      return
    }
    
    // 0주차부터 weeksAhead주차까지 생성
    for (let week = 0; week <= weeksAhead; week++) {
      const recurringDate = new Date(date)
      recurringDate.setDate(date.getDate() + (week * 7))
      const formattedDate = formatDate(recurringDate)
      allDates.push(formattedDate)
    }
  })
  
  // 중복 제거 및 정렬
  const uniqueDates = [...new Set(allDates)].sort()
  return uniqueDates
}
