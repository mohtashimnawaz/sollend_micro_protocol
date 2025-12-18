import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import idl from '../idl/sollend_micro_protocol.json'
import { PublicKey } from '@solana/web3.js'

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const { provider, program } = useMemo(() => {
    // Return null if wallet is not connected
    if (!wallet.publicKey) {
      return { provider: null, program: null }
    }

    try {
      // Create provider with wallet adapter
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { 
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
        }
      )

      // Create program instance
      const programId = new PublicKey(idl.address)
      const program = new Program(idl as any, programId, provider)

      return { provider, program }
    } catch (error) {
      console.error('Error initializing program:', error)
      return { provider: null, program: null }
    }
  }, [connection, wallet, wallet.publicKey])

  return { program, provider }
}
