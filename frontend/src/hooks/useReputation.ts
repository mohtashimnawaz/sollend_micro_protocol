import { useEffect, useState } from 'react'
import { useProgram } from './useProgram'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'

export function useReputation() {
  const { program } = useProgram()
  const { publicKey } = useWallet()
  const [reputation, setReputation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reputationPda, setReputationPda] = useState<PublicKey | null>(null)

  useEffect(() => {
    loadReputation()
  }, [program, publicKey])

  const loadReputation = async () => {
    if (!program || !publicKey) {
      setLoading(false)
      return
    }

    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('reputation'), publicKey.toBuffer()],
        program.programId
      )
      setReputationPda(pda)

      const rep = await program.account.reputationAccount.fetch(pda)
      setReputation(rep)
    } catch (error) {
      // Reputation doesn't exist yet
      setReputation(null)
    } finally {
      setLoading(false)
    }
  }

  const createReputation = async () => {
    if (!program || !publicKey || !reputationPda) return

    try {
      await program.methods
        .createReputation()
        .accounts({
          reputation: reputationPda,
          owner: publicKey,
        })
        .rpc()

      await loadReputation()
      return true
    } catch (error) {
      console.error('Failed to create reputation:', error)
      return false
    }
  }

  const getTierInfo = () => {
    if (!reputation) return null

    const tiers = [
      { name: 'A', color: 'green', minScore: 800 },
      { name: 'B', color: 'blue', minScore: 600 },
      { name: 'C', color: 'yellow', minScore: 400 },
      { name: 'D', color: 'red', minScore: 0 },
    ]

    return tiers[reputation.creditTier]
  }

  return {
    reputation,
    reputationPda,
    loading,
    createReputation,
    refreshReputation: loadReputation,
    tierInfo: getTierInfo(),
  }
}
