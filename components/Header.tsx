import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-soft">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/order" className="flex items-center">
          <Image
            src="/data/baobab.png"
            alt="Bao Bab"
            width={144}
            height={48}
            className="h-10 sm:h-12 w-auto"
            priority
            unoptimized
          />
        </Link>
        <Link
          href="/my-orders"
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-primary active:text-primary transition-colors min-h-[44px] flex items-center"
        >
          My Orders
        </Link>
      </div>
    </header>
  )
}
