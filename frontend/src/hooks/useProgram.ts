import { useMemo } from 'react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import idl from '../../../target/idl/sollend_micro_protocol.json'

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  const program = useMemo(() => {
    if (!wallet) return null

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })

    const programId = new PublicKey(
      process.env.NEXT_PUBLIC_PROGRAM_ID || idl.metadata.address
    )

    return new Program(idl as any, programId, provider)
  }, [connection, wallet])

  return { program, wallet }
}
