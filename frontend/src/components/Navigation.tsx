'use client'

import Link from 'next/link'
import { BellIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { WalletButton } from './WalletButton'

interface NavigationProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Navigation({ sidebarOpen, setSidebarOpen }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10 transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 via-yellow-600 to-amber-700 animate-gradient shadow-lg"></div>
      
      <div className="px-4 lg:px-8 h-20 flex items-center justify-between relative">
        {/* Left: Menu Toggle + Logo */}
        <div className="flex items-center space-x-3 lg:space-x-6">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-300 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 group"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-6 h-6 lg:w-7 lg:h-7 transition-transform group-hover:scale-110" />
            ) : (
              <Bars3Icon className="w-6 h-6 lg:w-7 lg:h-7 transition-transform group-hover:scale-110" />
            )}
          </button>

          <Link href="/" className="group flex items-center space-x-2 lg:space-x-4 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl lg:rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse-slow"></div>
              <div className="relative w-10 h-10 lg:w-14 lg:h-14 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300 border-2 border-amber-400/30">
                <span className="text-white font-black text-lg lg:text-2xl">S</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 animate-gradient drop-shadow-lg">Sollend</span>
              <div className="text-xs lg:text-sm text-amber-400 font-bold tracking-wide">Ancient Wisdom, Modern Finance</div>
            </div>
          </Link>
        </div>

        {/* Center: Tagline - Enhanced */}
        <div className="flex-1 max-w-3xl mx-4 lg:mx-12 hidden md:block">
          <div className="text-center space-y-1">
            <div className="text-sm lg:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 animate-gradient drop-shadow-lg flex items-center justify-center gap-2">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-amber-400 animate-chakra" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <path d="M12 2 L12 10 M12 14 L12 22 M2 12 L10 12 M14 12 L22 12 M5 5 L10 10 M14 14 L19 19 M19 5 L14 10 M10 14 L5 19" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Reputation-Based Micro-Lending on Solana</span>
            </div>
            <div className="flex items-center justify-center gap-2 lg:gap-3 text-xs font-semibold text-amber-400/80">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                On-Chain Credit
              </span>
              <span className="text-amber-600">•</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                Instant Treasury
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* Notifications */}
          <button className="relative p-2 lg:p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <BellIcon className="relative w-5 h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Wallet Button */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 animate-gradient"></div>
            <div className="relative">
              <WalletButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
