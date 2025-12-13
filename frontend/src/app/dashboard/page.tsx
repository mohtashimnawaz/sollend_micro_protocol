'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useReputation } from '@/hooks/useReputation'
import { useProgram } from '@/hooks/useProgram'
import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { connected, publicKey } = useWallet()
  const { reputation, loading: repLoading, tierInfo } = useReputation()
  const { program } = useProgram()
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLoans()
  }, [program, publicKey])

  const loadLoans = async () => {
    if (!program || !publicKey) {
      setLoading(false)
      return
    }

    try {
      const allLoans = await program.account.loanAccount.all()
      
      const myLoans = allLoans
        .filter((loan: any) => 
          loan.account.borrower.toString() === publicKey.toString() ||
          loan.account.lender?.toString() === publicKey.toString()
        )
        .map((loan: any) => ({
          ...loan.account,
          publicKey: loan.publicKey,
        }))

      setLoans(myLoans)
    } catch (error) {
      console.error('Failed to load loans:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
      </div>
    )
  }

  if (repLoading || loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  const activeBorrowed = loans.filter(l => 
    l.borrower.toString() === publicKey?.toString() && 
    (l.state.funded || l.state.active)
  )
  
  const activeLent = loans.filter(l => 
    l.lender?.toString() === publicKey?.toString() && 
    (l.state.funded || l.state.active)
  )

  const completedLoans = loans.filter(l => l.state.repaid)
  const defaultedLoans = loans.filter(l => l.state.defaulted)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your loans and track your credit reputation
        </p>
      </div>

      {/* Credit Overview */}
      {reputation && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Credit Overview</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <CreditStat label="Credit Score" value={reputation.creditScore} color={tierInfo?.color} />
            <CreditStat label="Credit Tier" value={`Tier ${tierInfo?.name}`} color={tierInfo?.color} />
            <CreditStat label="Active Loans" value={reputation.activeLoans} />
            <CreditStat label="Completed" value={reputation.completedLoans} />
            <CreditStat 
              label="Status" 
              value={reputation.isFrozen ? 'Frozen' : 'Active'} 
              color={reputation.isFrozen ? 'red' : 'green'}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Borrowed (Active)" 
          value={activeBorrowed.length}
          subtitle={`${activeBorrowed.reduce((sum, l) => sum + l.amount.toNumber() / 1e9, 0).toFixed(2)} tokens`}
          icon="📤"
          color="blue"
        />
        <StatCard 
          title="Lent (Active)" 
          value={activeLent.length}
          subtitle={`${activeLent.reduce((sum, l) => sum + l.amount.toNumber() / 1e9, 0).toFixed(2)} tokens`}
          icon="📥"
          color="green"
        />
        <StatCard 
          title="Completed" 
          value={completedLoans.length}
          subtitle="Successful loans"
          icon="✅"
          color="green"
        />
        <StatCard 
          title="Defaults" 
          value={defaultedLoans.length}
          subtitle={reputation?.defaultedLoans || 0}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* Active Borrowed Loans */}
      {activeBorrowed.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Active Borrowed Loans</h2>
          <div className="space-y-4">
            {activeBorrowed.map(loan => (
              <LoanCard key={loan.publicKey.toString()} loan={loan} type="borrower" />
            ))}
          </div>
        </div>
      )}

      {/* Active Lent Loans */}
      {activeLent.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Active Lent Loans</h2>
          <div className="space-y-4">
            {activeLent.map(loan => (
              <LoanCard key={loan.publicKey.toString()} loan={loan} type="lender" />
            ))}
          </div>
        </div>
      )}

      {/* Loan History */}
      {(completedLoans.length > 0 || defaultedLoans.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Loan History</h2>
          <div className="space-y-4">
            {[...completedLoans, ...defaultedLoans].map(loan => (
              <LoanCard key={loan.publicKey.toString()} loan={loan} type="history" />
            ))}
          </div>
        </div>
      )}

      {loans.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-lg text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You don't have any loans yet.
          </p>
          <div className="space-x-4">
            <a 
              href="/borrow"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Request a Loan
            </a>
            <a 
              href="/lend"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Fund a Loan
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function CreditStat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className={`text-2xl font-bold mb-1 ${color ? `text-${color}-600` : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }: { 
  title: string; 
  value: number; 
  subtitle: string; 
  icon: string; 
  color: string 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</div>
    </div>
  )
}

function LoanCard({ loan, type }: { loan: any; type: 'borrower' | 'lender' | 'history' }) {
  const getStateLabel = () => {
    if (loan.state.requested) return 'Requested'
    if (loan.state.funded) return 'Funded'
    if (loan.state.active) return 'Active'
    if (loan.state.repaid) return 'Repaid'
    if (loan.state.defaulted) return 'Defaulted'
    return 'Unknown'
  }

  const getStateColor = () => {
    if (loan.state.repaid) return 'green'
    if (loan.state.defaulted) return 'red'
    if (loan.state.active) return 'blue'
    if (loan.state.funded) return 'yellow'
    return 'gray'
  }

  const amount = (loan.amount.toNumber() / 1e9).toFixed(2)
  const duration = Math.floor(loan.durationSeconds.toNumber() / 86400)
  const interestRate = loan.interestRateBps / 100

  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm text-gray-500">Loan ID: {loan.loanId.toString()}</div>
          <div className="text-xs text-gray-400 mt-1">
            {type === 'borrower' ? 'Borrowing from' : 'Lending to'}: {' '}
            {type === 'borrower' 
              ? loan.lender?.toString().slice(0, 8) + '...'
              : loan.borrower.toString().slice(0, 8) + '...'
            }
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getStateColor()}-100 text-${getStateColor()}-800`}>
          {getStateLabel()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Amount</div>
          <div className="font-semibold">{amount} tokens</div>
        </div>
        <div>
          <div className="text-gray-500">Duration</div>
          <div className="font-semibold">{duration} days</div>
        </div>
        <div>
          <div className="text-gray-500">Interest</div>
          <div className="font-semibold">{interestRate}%</div>
        </div>
      </div>

      {loan.state.active && type === 'borrower' && (
        <button className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded-lg transition-colors">
          Repay Loan
        </button>
      )}
    </div>
  )
}
