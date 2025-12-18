'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'
import { useState } from 'react'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-full blur-3xl animate-float"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-orange-500/30 to-red-600/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/25 to-teal-600/25 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-500/25 to-pink-600/25 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>
            
            {/* Content Wrapper with Backdrop */}
            <div className="relative z-10 backdrop-blur-sm bg-gray-900/90 min-h-screen">
              {/* Top Navigation Bar - Dynamic */}
              <Navigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              
              {/* Left Sidebar - Collapsible - Outside flex container for true fixed positioning */}
              <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              
              {/* Main Content Area - Adapts to sidebar state */}
              <main 
                className={`pt-20 min-h-screen transition-all duration-300 ease-in-out ${
                  sidebarOpen ? 'lg:ml-72 ml-0' : 'ml-0 lg:ml-20'
                }`}
              >
                  <div className="px-4 lg:px-8 py-8">
                    {children}
                  </div>
                </main>
              
              {/* Mobile Overlay */}
              {sidebarOpen && (
                <div 
                  className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
            </div>
          </div>
        </WalletProvider>
      </body>
    </html>
  )
}
