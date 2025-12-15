'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  BanknotesIcon, 
  ArrowTrendingUpIcon,
  ChartBarIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Borrow', href: '/borrow', icon: BanknotesIcon },
  { name: 'Lend', href: '/lend', icon: ArrowTrendingUpIcon },
  { name: 'Stats', href: '/stats', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 glass-dark border-r border-white/10 backdrop-blur-xl overflow-y-auto">
      {/* Decorative blur orbs */}
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-500/30 to-red-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
      
      <nav className="relative p-4 space-y-2">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href
          const gradients = [
            'from-cyan-500 to-blue-600',
            'from-emerald-500 to-teal-600', 
            'from-orange-500 to-red-600',
            'from-fuchsia-500 to-pink-600',
            'from-yellow-500 to-orange-600'
          ]
          const gradient = gradients[index % gradients.length]
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative
                ${isActive 
                  ? `bg-gradient-to-r ${gradient} text-white shadow-xl shadow-${gradient.split('-')[1]}-500/50 animate-glow` 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl animate-gradient opacity-50`}></div>
              )}
              
              <item.icon className={`relative w-5 h-5 ${isActive ? 'animate-pulse-slow' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="relative">{item.name}</span>
              
              {isActive && (
                <div className="absolute right-3 flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-gradient-to-t from-gray-900/50 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Network</span>
            <span className="px-2 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-md font-semibold border border-emerald-500/30">
              Devnet
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Protocol</span>
            <span className="relative px-2 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-md font-semibold border border-cyan-500/30 shimmer">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
