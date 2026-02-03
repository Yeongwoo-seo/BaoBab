export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12 sm:mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm text-gray-600">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">사업자 정보</h3>
            <p>Bao Bab Lunchbox PTY LTD</p>
            <p>Unit 804, 2C Wharf Road</p>
            <p>Melrose Park, NSW</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">고객센터</h3>
            <p>Email: baobab.lunchbox@gmail.com</p>
            <p>Phone: 0492 047 778</p>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 text-center text-[10px] sm:text-xs text-gray-500">
          <p>© 2026 Bao Bab Lunchbox PTY LTD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
