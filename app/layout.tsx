import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: { default: 'MyTownship — Hotel & Logistics Services', template: '%s | MyTownship' },
  description: 'Premium hotel booking and logistics services across Nigeria. Pay with Charity Token.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable} antialiased`}
        style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}