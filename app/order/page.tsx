'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import OrderForm from '@/components/OrderForm'
import Notice from '@/components/Notice'
import Introduction from '@/components/Introduction'
import ImportantNotice from '@/components/ImportantNotice'

export default function OrderPage() {
  const [isAgreed, setIsAgreed] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6">
          {/* 소개글 섹션 */}
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6 md:p-8">
            <Introduction />
          </div>

          {/* 유의사항 섹션 */}
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6 md:p-8">
            <ImportantNotice onAgreementChange={setIsAgreed} />
          </div>

          {/* 주문 폼 섹션 */}
          <div className="bg-white rounded-card shadow-card p-4 sm:p-6 md:p-8">
            <Notice />
            <OrderForm isAgreed={isAgreed} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
