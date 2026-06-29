import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/shared/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Health Record System',
  description: 'Centralized Patient Health Record Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ padding: '24px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}