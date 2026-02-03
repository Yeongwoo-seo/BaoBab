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
  const days: ('월' | '화' | '수' | '목' | '금')[] = ['일', '월', '화', '수', '목', '금', '토']
  return days[day] as '월' | '화' | '수' | '목' | '금'
}

export function getNextWeekDates(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  
  // 다음 주 월요일부터 시작
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(nextMonday)
    date.setDate(nextMonday.getDate() + i)
    dates.push(date)
  }
  
  return dates
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
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
