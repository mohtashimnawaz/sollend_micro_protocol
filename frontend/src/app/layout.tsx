'use client'

import { Cinzel, Poppins } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'
import { useState } from 'react'

const cinzel = Cinzel({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
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
      <body className={`${poppins.className} ${cinzel.variable}`}>
        <WalletProvider>
          <div className="min-h-screen relative overflow-hidden">
            {/* Ancient Background Patterns */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              {/* Warm terracotta and sandstone orbs */}
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-600/20 to-orange-700/20 rounded-full blur-3xl animate-float"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-yellow-600/20 to-amber-700/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-orange-600/15 to-amber-700/15 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-600/15 to-yellow-700/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
              
              {/* Ancient pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 ashoka-pattern"></div>
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, rgba(218, 165, 32, 0.15) 0%, transparent 50%),
                                   radial-gradient(circle at 75% 75%, rgba(184, 134, 11, 0.15) 0%, transparent 50%),
                                   radial-gradient(circle at 50% 50%, rgba(205, 127, 50, 0.1) 0%, transparent 70%)`,
                  backgroundSize: '800px 800px, 600px 600px, 1000px 1000px',
                  animation: 'rotate-chakra 120s linear infinite'
                }}></div>
              </div>
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
