'use client'

import Link from 'next/link'
import { BellIcon } from '@heroicons/react/24/outline'
import { WalletButton } from './WalletButton'

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark backdrop-blur-2xl border-b border-white/10 shadow-2xl">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 via-orange-500 to-fuchsia-500 animate-gradient"></div>
      
      <div className="px-4 h-16 flex items-center justify-between relative">
        {/* Left: Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="group flex items-center space-x-3 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse-slow"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-black text-xl">S</span>
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 animate-gradient">Sollend</span>
              <div className="text-xs text-orange-400 font-semibold">DeFi Reimagined</div>
            </div>
          </Link>
        </div>

        {/* Center: Tagline */}
        <div className="flex-1 max-w-2xl mx-8 hidden lg:block">
          <div className="text-center">
            <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 animate-gradient">
              🚀 Reputation-Based Micro-Lending on Solana
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <BellIcon className="relative w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></span>
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
