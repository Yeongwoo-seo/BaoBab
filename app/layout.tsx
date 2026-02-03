import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bao Bab - Modern Australian Lunchbox',
  description: '호주 시드니 기반 도시락 브랜드 Bao Bab의 온라인 주문 시스템',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    title: 'Bao Bab - Modern Australian Lunchbox',
    description: '호주 시드니 기반 도시락 브랜드 Bao Bab의 온라인 주문 시스템',
    images: [
      {
        url: '/data/baobab.png',
        width: 1200,
        height: 630,
        alt: 'Bao Bab Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bao Bab - Modern Australian Lunchbox',
    description: '호주 시드니 기반 도시락 브랜드 Bao Bab의 온라인 주문 시스템',
    images: ['/data/baobab.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className={`${inter.className} font-pretendard antialiased`}>
        {children}
      </body>
    </html>
  )
}
