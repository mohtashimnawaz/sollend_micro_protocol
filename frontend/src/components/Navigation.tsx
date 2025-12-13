'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">Sollend</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            <NavLink href="/" active={isActive('/')}>
              Home
            </NavLink>
            <NavLink href="/borrow" active={isActive('/borrow')}>
              Borrow
            </NavLink>
            <NavLink href="/lend" active={isActive('/lend')}>
              Lend
            </NavLink>
            <NavLink href="/dashboard" active={isActive('/dashboard')}>
              Dashboard
            </NavLink>
            <NavLink href="/stats" active={isActive('/stats')}>
              Stats
            </NavLink>
          </div>

          {/* Wallet Button */}
          <div>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </Link>
  )
}
