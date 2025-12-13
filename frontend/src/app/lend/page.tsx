'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useProgram } from '@/hooks/useProgram'
import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

export default function LendPage() {
  const { connected, publicKey } = useWallet()
  const { program } = useProgram()
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [funding, setFunding] = useState<string | null>(null)

  useEffect(() => {
    loadLoans()
  }, [program])

  const loadLoans = async () => {
    if (!program) return

    try {
      const allLoans = await program.account.loanAccount.all()
      
      // Filter for requested loans only
      const requestedLoans = allLoans
        .filter((loan: any) => loan.account.state.requested !== undefined)
        .map((loan: any) => ({
          ...loan.account,
          publicKey: loan.publicKey,
        }))

      setLoans(requestedLoans)
    } catch (error) {
      console.error('Failed to load loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFundLoan = async (loan: any, interestRate: number) => {
    if (!program || !publicKey) return

    try {
      setFunding(loan.publicKey.toString())

      // Get borrower's reputation to determine tier
      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('reputation'), loan.borrower.toBuffer()],
        program.programId
      )

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
      )

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('escrow'),
          loan.borrower.toBuffer(),
          loan.loanId.toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      )

      // This would need actual token accounts - simplified for demo
      // In production, you'd get the mint from config and create proper token accounts
      
      alert('Funding functionality requires token accounts setup. See API docs for full implementation.')
      
    } catch (error: any) {
      console.error('Failed to fund loan:', error)
      alert(`Failed to fund loan: ${error.message}`)
    } finally {
      setFunding(null)
    }
  }

  if (!connected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to lend funds.</p>
      </div>
    )
  }

  const filteredLoans = selectedTier === 'all' 
    ? loans 
    : loans.filter(loan => {
        // This would need to fetch reputation for each loan
        return true // Simplified
      })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Lending Marketplace</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Browse loan requests and fund borrowers based on their credit tier and risk profile.
        </p>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-4 py-2 rounded-lg ${selectedTier === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            All Tiers
          </button>
          <button
            onClick={() => setSelectedTier('A')}
            className={`px-4 py-2 rounded-lg ${selectedTier === 'A' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Tier A
          </button>
          <button
            onClick={() => setSelectedTier('B')}
            className={`px-4 py-2 rounded-lg ${selectedTier === 'B' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Tier B
          </button>
          <button
            onClick={() => setSelectedTier('C')}
            className={`px-4 py-2 rounded-lg ${selectedTier === 'C' ? 'bg-yellow-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Tier C
          </button>
          <button
            onClick={() => setSelectedTier('D')}
            className={`px-4 py-2 rounded-lg ${selectedTier === 'D' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Tier D
          </button>
        </div>
      </div>

      {/* Loan Requests */}
      {loading ? (
        <div className="text-center py-12">Loading loan requests...</div>
      ) : filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-lg text-center">
          <p className="text-gray-600 dark:text-gray-300">No loan requests available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredLoans.map((loan) => (
            <LoanCard 
              key={loan.publicKey.toString()} 
              loan={loan} 
              onFund={handleFundLoan}
              funding={funding === loan.publicKey.toString()}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LoanCard({ loan, onFund, funding }: { loan: any; onFund: (loan: any, rate: number) => void; funding: boolean }) {
  const [interestRate, setInterestRate] = useState(loan.suggestedInterestRateBps / 100)

  const amount = (loan.amount.toNumber() / 1e9).toFixed(2)
  const duration = Math.floor(loan.durationSeconds.toNumber() / 86400)
  const maxRate = loan.maxInterestRateBps / 100
  const suggestedRate = loan.suggestedInterestRateBps / 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors">
      <div className="grid md:grid-cols-4 gap-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">Loan Amount</div>
          <div className="text-2xl font-bold">{amount} tokens</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Duration</div>
          <div className="text-2xl font-bold">{duration} days</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Max Rate</div>
          <div className="text-2xl font-bold">{maxRate}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Suggested Rate</div>
          <div className="text-2xl font-bold text-primary-600">{suggestedRate}%</div>
        </div>
      </div>

      <div className="mt-6 flex items-end space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">
            Your Interest Rate (%)
          </label>
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
            max={maxRate}
            step="0.1"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
        </div>
        <button
          onClick={() => onFund(loan, interestRate * 100)}
          disabled={funding || interestRate > maxRate}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          {funding ? 'Funding...' : 'Fund Loan'}
        </button>
      </div>

      {interestRate > maxRate && (
        <p className="text-sm text-red-600 mt-2">
          Interest rate cannot exceed borrower's maximum of {maxRate}%
        </p>
      )}
    </div>
  )
}
