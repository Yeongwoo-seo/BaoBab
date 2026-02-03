'use client'

import { useState } from 'react'

interface ImportantNoticeProps {
  onAgreementChange?: (agreed: boolean) => void
}

export default function ImportantNotice({ onAgreementChange }: ImportantNoticeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)

  const handleAgreementChange = (checked: boolean) => {
    setIsAgreed(checked)
    onAgreementChange?.(checked)
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-card hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2">
          <span className="text-base">📋</span>
          유의사항 확인하기 <span className="text-red-500 text-xs">(필수)</span>
        </span>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 p-3 sm:p-4 md:p-6 bg-white border border-gray-200 rounded-card space-y-4 sm:space-y-5">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">📅</span>
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1.5">주문 마감</h3>
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold text-primary">매주 목요일 5시</span>에 주문을 마감합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">📍</span>
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1.5">수령 장소</h3>
                <p className="text-xs sm:text-sm text-gray-700">
                  Kings Park, Eastern Creek 모두 <span className="font-semibold text-primary">프레임캐드 팀</span>으로 배송됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">💳</span>
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1.5">결제 안내</h3>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                  <li>• 본 서비스는 <span className="font-semibold text-primary">사전 결제제</span>로 운영됩니다.</li>
                  <li>• <span className="font-semibold text-primary">매주 월요일</span>(또는 첫 번째 평일)에 캐쉬 또는 계좌로 입금해 주세요.</li>
                  <li>• 입금 확인이 되지 않은 주문은 수령이 어려울 수 있습니다.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">🚫</span>
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1.5">취소 및 환불 규정</h3>
                <p className="text-xs sm:text-sm text-gray-700">
                  취소 및 변경은 <span className="font-semibold text-primary">전날 오후 12시까지</span> 가능합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => handleAgreementChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
              />
              <span className="text-[10px] sm:text-xs text-gray-700">
                위의 유의사항을 모두 숙지하였으며 이에 동의합니다.
              </span>
            </label>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="mt-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => handleAgreementChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
            />
            <span className="text-[10px] sm:text-xs text-gray-700">
              위의 유의사항을 모두 숙지하였으며 이에 동의합니다.
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
