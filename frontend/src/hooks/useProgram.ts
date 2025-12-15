import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, setProvider } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import idl from '../idl/sollend_micro_protocol.json'
import { PublicKey } from '@solana/web3.js'

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const provider = useMemo(() => {
    if (!wallet) return null
    return new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    })
  }, [connection, wallet])

  const program = useMemo(() => {
    if (!provider) return null
    setProvider(provider)
    const programId = new PublicKey(idl.address)
    return new Program(idl as any, programId, provider)
  }, [provider])

  return { program, provider }
}
