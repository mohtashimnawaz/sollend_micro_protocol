'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useReputation } from '@/hooks/useReputation'
import { useState } from 'react'
import { useProgram } from '@/hooks/useProgram'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

export default function BorrowPage() {
  const { connected, publicKey } = useWallet()
  const { reputation, loading, createReputation, reputationPda, tierInfo } = useReputation()
  const { program } = useProgram()
  const [creating, setCreating] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const [loanForm, setLoanForm] = useState({
    amount: '',
    durationDays: '30',
    maxInterestRate: '',
  })

  if (!connected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to borrow funds.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading your profile...</div>
      </div>
    )
  }

  if (!reputation) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Create Your Reputation Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Before you can borrow, you need to create your Soulbound reputation NFT.
            This will track your credit history on-chain.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-2">Initial Credit Profile</h3>
            <div className="space-y-2 text-sm">
              <div>Credit Score: <span className="font-bold">500</span></div>
              <div>Credit Tier: <span className="font-bold">C</span></div>
              <div>Max Borrow: <span className="font-bold">25 tokens</span></div>
              <div>Interest Rate: <span className="font-bold">~10%</span></div>
            </div>
          </div>

          <button
            onClick={async () => {
              setCreating(true)
              await createReputation()
              setCreating(false)
            }}
            disabled={creating}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            {creating ? 'Creating...' : 'Create Reputation NFT'}
          </button>
        </div>
      </div>
    )
  }

  const handleCreateLoan = async () => {
    if (!program || !publicKey || !reputationPda) return

    try {
      setRequesting(true)

      const loanId = new BN(Date.now())
      const amount = new BN(parseFloat(loanForm.amount) * 1e9)
      const durationSeconds = new BN(parseInt(loanForm.durationDays) * 86400)
      const maxInterestRate = parseInt(loanForm.maxInterestRate)

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
      )

      const [loanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('loan'),
          publicKey.toBuffer(),
          loanId.toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      )

      await program.methods
        .createLoanRequest(loanId, amount, durationSeconds, maxInterestRate)
        .accounts({
          loan: loanPda,
          borrowerReputation: reputationPda,
          config: configPda,
          borrower: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      alert('Loan request created successfully!')
      setLoanForm({ amount: '', durationDays: '30', maxInterestRate: '' })
    } catch (error: any) {
      console.error('Failed to create loan:', error)
      alert(`Failed to create loan: ${error.message}`)
    } finally {
      setRequesting(false)
    }
  }

  const maxBorrowAmounts = [100, 50, 25, 10]
  const maxBorrow = maxBorrowAmounts[reputation.creditTier]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Credit Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Your Credit Profile</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <ProfileStat label="Credit Score" value={reputation.creditScore} />
          <ProfileStat 
            label="Credit Tier" 
            value={`Tier ${tierInfo?.name}`}
            color={tierInfo?.color}
          />
          <ProfileStat label="Active Loans" value={reputation.activeLoans} />
          <ProfileStat label="Completed" value={reputation.completedLoans} />
        </div>

        {reputation.isFrozen && (
          <div className="mt-4 bg-red-100 dark:bg-red-900/20 border border-red-300 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 font-semibold">
              ⚠️ Your account is frozen due to a default. Contact support for rehabilitation.
            </p>
          </div>
        )}
      </div>

      {/* Loan Request Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Create Loan Request</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Loan Amount (max: {maxBorrow} tokens)
            </label>
            <input
              type="number"
              value={loanForm.amount}
              onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
              max={maxBorrow}
              step="0.1"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Duration (days)
            </label>
            <select
              value={loanForm.durationDays}
              onChange={(e) => setLoanForm({ ...loanForm, durationDays: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Maximum Interest Rate (%)
            </label>
            <input
              type="number"
              value={loanForm.maxInterestRate}
              onChange={(e) => setLoanForm({ ...loanForm, maxInterestRate: e.target.value })}
              step="0.1"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="15"
            />
            <p className="text-sm text-gray-500 mt-1">
              Suggested: ~{5 + [0, 2, 5, 10][reputation.creditTier]}%
            </p>
          </div>

          <button
            onClick={handleCreateLoan}
            disabled={requesting || reputation.isFrozen || !loanForm.amount || !loanForm.maxInterestRate}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {requesting ? 'Creating...' : 'Create Loan Request'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3">Repayment History</h3>
          <div className="space-y-2">
            <StatRow label="On-Time Payments" value={reputation.onTimePayments} color="green" />
            <StatRow label="Late Payments" value={reputation.latePayments} color="yellow" />
            <StatRow label="Defaults" value={reputation.defaultedLoans} color="red" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3">Borrowing Stats</h3>
          <div className="space-y-2">
            <StatRow 
              label="Total Borrowed" 
              value={`${(reputation.totalBorrowed.toNumber() / 1e9).toFixed(2)} tokens`} 
            />
            <StatRow 
              label="Total Repaid" 
              value={`${(reputation.totalRepaid.toNumber() / 1e9).toFixed(2)} tokens`} 
            />
            <StatRow label="Total Loans" value={reputation.totalLoans} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileStat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className={`text-2xl font-bold mb-1 ${color ? `text-${color}-600` : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className={`font-semibold ${color ? `text-${color}-600` : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  )
}
