import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-card shadow-card p-4 sm:p-6 md:p-8 text-center">
          <div className="mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">주문이 완료되었습니다!</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Link
              href="/order"
              className="inline-block w-full sm:w-auto px-6 py-3 min-h-[52px] bg-primary text-white font-semibold rounded-card hover:bg-primary-dark active:bg-primary-dark transition-colors flex items-center justify-center text-base"
            >
              추가 주문하기
            </Link>
            <Link
              href="/my-orders"
              className="inline-block w-full sm:w-auto px-6 py-3 min-h-[52px] bg-gray-100 text-gray-700 font-semibold rounded-card hover:bg-gray-200 active:bg-gray-200 transition-colors flex items-center justify-center text-base"
            >
              내 주문 보기
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
