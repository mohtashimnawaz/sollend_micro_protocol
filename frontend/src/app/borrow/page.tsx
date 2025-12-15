'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useReputation } from '@/hooks/useReputation'
import { useLoans } from '@/hooks/useLoans'
import { useState } from 'react'
import { BoltIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function BorrowPage() {
  const wallet = useWallet()
  const { reputation, loading: repLoading, createReputation, getCreditTierName } = useReputation()
  const { loans, loading: loanLoading, createLoanRequest, getLoanStateName } = useLoans()
  
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !duration || !maxRate) return

    try {
      setCreating(true)
      await createLoanRequest(
        parseFloat(amount),
        parseInt(duration),
        parseInt(maxRate)
      )
      setAmount('')
      setDuration('')
      setMaxRate('')
    } catch (error) {
      console.error('Error creating loan:', error)
    } finally {
      setCreating(false)
    }
  }

  if (!wallet.connected) {
    return (
      <div className="p-8">
        <div className="glass-dark p-16 rounded-3xl border border-white/10 text-center">
          <p className="text-2xl text-white font-bold mb-4">Wallet Not Connected</p>
          <p className="text-gray-300">Please connect your wallet to start borrowing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-8">
        Borrow Funds
      </h1>

      {/* Reputation Card */}
      <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/30 p-8">
        <h2 className="text-2xl font-bold text-cyan-300 mb-6">Your Credit Profile</h2>
        
        {repLoading ? (
          <p className="text-gray-300">Loading reputation...</p>
        ) : reputation ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Credit Score</p>
              <p className="text-3xl font-black text-white">{reputation.creditScore}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Credit Tier</p>
              <p className="text-xl font-bold text-cyan-300">{getCreditTierName(reputation.creditTier)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Active Loans</p>
              <p className="text-3xl font-black text-white">{reputation.activeLoans}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Loans</p>
              <p className="text-xl font-bold text-gray-200">{reputation.totalLoans}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Completed</p>
              <p className="text-xl font-bold text-emerald-400">{reputation.completedLoans}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Defaulted</p>
              <p className="text-xl font-bold text-red-400">{reputation.defaultedLoans}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">No reputation found. Create one to start borrowing.</p>
            <button
              onClick={createReputation}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
            >
              Create Reputation
            </button>
          </div>
        )}
      </div>

      {/* Create Loan Form */}
      {reputation && (
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl rounded-2xl border-2 border-emerald-500/30 p-8">
          <h2 className="text-2xl font-bold text-emerald-300 mb-6 flex items-center gap-2">
            <BoltIcon className="w-7 h-7" />
            Request New Loan
          </h2>

          <form onSubmit={handleCreateLoan} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Loan Amount (SOL)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-emerald-500/30 rounded-xl text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                placeholder="e.g., 10"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Duration (Days)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-emerald-500/30 rounded-xl text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                placeholder="e.g., 30"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Max Interest Rate (%)</label>
              <input
                type="number"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-emerald-500/30 rounded-xl text-white placeholder-gray-500 focus:border-emerald-400 focus:outline-none"
                placeholder="e.g., 15"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {creating ? 'Creating...' : 'Request Loan'}
            </button>
          </form>
        </div>
      )}

      {/* Active Loans */}
      <div className="bg-gradient-to-br from-fuchsia-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl border-2 border-fuchsia-500/30 p-8">
        <h2 className="text-2xl font-bold text-fuchsia-300 mb-6">Your Loans</h2>

        {loanLoading ? (
          <p className="text-gray-300">Loading loans...</p>
        ) : loans.length > 0 ? (
          <div className="space-y-4">
            {loans.map((loan, idx) => (
              <div key={idx} className="bg-black/30 p-6 rounded-xl border border-fuchsia-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold text-white">
                    {(loan.amount.toNumber() / 1e9).toFixed(2)} SOL
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    getLoanStateName(loan.state) === 'Requested' ? 'bg-yellow-500/20 text-yellow-300' :
                    getLoanStateName(loan.state) === 'Active' ? 'bg-blue-500/20 text-blue-300' :
                    getLoanStateName(loan.state) === 'Repaid' ? 'bg-emerald-500/20 text-emerald-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {getLoanStateName(loan.state)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white font-semibold">{loan.durationSeconds.toNumber() / 86400} days</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Interest Rate</p>
                    <p className="text-white font-semibold">{loan.maxInterestRateBps / 100}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-300 text-center py-8">No loans yet. Create your first loan request above!</p>
        )}
      </div>
    </div>
  )
}
