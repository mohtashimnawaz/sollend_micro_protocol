import { useProgram } from './useProgram'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useState, useEffect } from 'react'
import { BN } from '@coral-xyz/anchor'

export interface Loan {
  borrower: PublicKey
  loanId: BN
  amount: BN
  fundedAmount: BN
  durationSeconds: BN
  maxInterestRateBps: number
  actualInterestRateBps: number
  suggestedInterestRateBps: number
  state: any
  createdAt: BN
  fundedAt: BN
  dueDate: BN
  repaidAt: BN
  lender: PublicKey | null
  repaidAmount: BN
  bump: number
}

export function useLoans() {
  const { program } = useProgram()
  const wallet = useWallet()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLoans = async () => {
    if (!program || !wallet.publicKey) {
      setLoans([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const allLoans = await program.account.loanAccount.all()
      const userLoans = allLoans.filter(
        (loan: any) => loan.account.borrower.equals(wallet.publicKey)
      )
      
      setLoans(userLoans.map((l: any) => l.account))
    } catch (err: any) {
      console.error('Error fetching loans:', err)
      setError(err.message)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  const createLoanRequest = async (
    amount: number,
    durationDays: number,
    maxInterestRate: number
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      setError(null)

      const loanId = new BN(Date.now())
      const [loanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('loan'),
          wallet.publicKey.toBuffer(),
          loanId.toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      )

      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('reputation'), wallet.publicKey.toBuffer()],
        program.programId
      )

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
      )

      const tx = await program.methods
        .createLoanRequest(
          loanId,
          new BN(amount * 1e9), // Convert to lamports
          new BN(durationDays * 24 * 60 * 60), // Convert days to seconds
          maxInterestRate * 100 // Convert to basis points
        )
        .accounts({
          loan: loanPda,
          borrowerReputation: reputationPda,
          config: configPda,
          borrower: wallet.publicKey,
        })
        .rpc()

      console.log('Loan request created:', tx)
      await fetchLoans()
      return tx
    } catch (err: any) {
      console.error('Error creating loan request:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getLoanStateName = (state: any): string => {
    if (state.requested) return 'Requested'
    if (state.funded) return 'Funded'
    if (state.active) return 'Active'
    if (state.repaid) return 'Repaid'
    if (state.defaulted) return 'Defaulted'
    if (state.cancelled) return 'Cancelled'
    return 'Unknown'
  }

  useEffect(() => {
    if (wallet.publicKey) {
      fetchLoans()
    }
  }, [wallet.publicKey, program])

  return {
    loans,
    loading,
    error,
    createLoanRequest,
    fetchLoans,
    getLoanStateName,
  }
}
