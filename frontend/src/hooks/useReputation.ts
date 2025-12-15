import { useProgram } from './useProgram'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useState, useEffect } from 'react'
import { BN } from '@coral-xyz/anchor'

export interface Reputation {
  owner: PublicKey
  creditScore: number
  creditTier: number
  totalLoans: number
  activeLoans: number
  completedLoans: number
  defaultedLoans: number
  totalBorrowed: BN
  totalRepaid: BN
  onTimePayments: number
  latePayments: number
  createdAt: BN
  lastUpdated: BN
  isFrozen: boolean
  bump: number
}

export function useReputation() {
  const { program } = useProgram()
  const wallet = useWallet()
  const [reputation, setReputation] = useState<Reputation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReputation = async () => {
    if (!program || !wallet.publicKey) {
      setReputation(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('reputation'), wallet.publicKey.toBuffer()],
        program.programId
      )

      const account = await program.account.reputationAccount.fetch(reputationPda)
      setReputation(account as any)
    } catch (err: any) {
      console.error('Error fetching reputation:', err)
      setError(err.message)
      setReputation(null)
    } finally {
      setLoading(false)
    }
  }

  const createReputation = async () => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      setError(null)

      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('reputation'), wallet.publicKey.toBuffer()],
        program.programId
      )

      const tx = await program.methods
        .createReputation()
        .accounts({
          reputation: reputationPda,
          owner: wallet.publicKey,
        })
        .rpc()

      console.log('Reputation created:', tx)
      await fetchReputation()
      return tx
    } catch (err: any) {
      console.error('Error creating reputation:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getCreditTierName = (tier: number): string => {
    switch (tier) {
      case 0: return 'D - Bronze'
      case 1: return 'C - Silver'
      case 2: return 'B - Gold'
      case 3: return 'A - Platinum'
      default: return 'Unknown'
    }
  }

  useEffect(() => {
    if (wallet.publicKey) {
      fetchReputation()
    }
  }, [wallet.publicKey, program])

  return {
    reputation,
    loading,
    error,
    createReputation,
    fetchReputation,
    getCreditTierName,
  }
}
