'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  BanknotesIcon, 
  ArrowTrendingUpIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Treasury', href: '/', icon: HomeIcon },
  { name: 'Borrow', href: '/borrow', icon: BanknotesIcon },
  { name: 'Lend', href: '/lend', icon: ArrowTrendingUpIcon },
  { name: 'Stats', href: '/stats', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar - Collapsible */}
      <aside 
        className={`fixed left-0 top-20 bottom-0 glass-dark border-r-2 border-amber-500/20 backdrop-blur-xl overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-0 lg:translate-x-0'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ position: 'fixed', top: '5rem', bottom: '0' }}
      >
        {/* Decorative blur orbs - Mauryan palette */}
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-gradient-to-br from-amber-600/30 to-yellow-700/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-br from-orange-600/30 to-red-800/30 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Navigation Header - Collapsible */}
        {sidebarOpen && (
          <div className="relative px-6 py-6 border-b border-amber-500/20 transition-opacity duration-300">
            <h2 className="text-xs font-black text-amber-400/70 uppercase tracking-wider mb-1">Navigation</h2>
            <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-semibold">Explore Treasury Protocol</p>
          </div>
        )}
        
        <nav className={`relative space-y-2.5 transition-all duration-300 ${sidebarOpen ? 'p-5' : 'p-3'}`}>
          {navigation.map((item, index) => {
            const isActive = pathname === item.href
            const gradients = [
              'from-amber-600 to-yellow-700',
              'from-orange-600 to-red-700', 
              'from-yellow-600 to-amber-700',
              'from-orange-500 to-amber-600',
              'from-yellow-500 to-orange-600'
            ]
            const gradient = gradients[index % gradients.length]
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`
                  group flex items-center rounded-xl text-base font-semibold transition-all duration-300 relative
                  ${sidebarOpen ? 'space-x-4 px-5 py-4' : 'justify-center px-3 py-4'}
                  ${isActive 
                    ? `bg-gradient-to-r ${gradient} text-white shadow-2xl animate-glow border-2 border-white/20` 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white border-2 border-transparent'
                  }
                `}
              >
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl animate-gradient opacity-50`}></div>
                )}
                
                <item.icon className={`relative w-6 h-6 flex-shrink-0 ${isActive ? 'animate-pulse-slow' : 'group-hover:scale-110 transition-transform'}`} />
                
                {sidebarOpen && (
                  <span className="relative font-bold whitespace-nowrap">{item.name}</span>
                )}
                
                {isActive && sidebarOpen && (
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

        {/* Footer - Collapsible */}
        <div className={`absolute bottom-0 left-0 right-0 border-t border-white/10 bg-gradient-to-t from-gray-900/50 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'p-4' : 'p-2'}`}>
          {sidebarOpen ? (
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
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" title="Devnet"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" title="v1.0.0" style={{ animationDelay: '0.5s' }}></div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
