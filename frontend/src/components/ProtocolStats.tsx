'use client'

import { useEffect, useState } from 'react'
import { useProgram } from '@/hooks/useProgram'
import { PublicKey } from '@solana/web3.js'

export function ProtocolStats() {
  const { program } = useProgram()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [program])

  const loadStats = async () => {
    if (!program) return

    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
      )

      const config = await program.account.protocolConfig.fetch(configPda)
      setStats(config)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Protocol Statistics
        </h2>
        <div className="text-center text-gray-500">Loading...</div>
      </section>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Protocol Statistics
      </h2>
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          label="Total Loans"
          value={stats.totalLoansIssued.toString()}
          icon="📊"
        />
        <StatCard
          label="Total Volume"
          value={`${(stats.totalVolume.toNumber() / 1e9).toFixed(2)} tokens`}
          icon="💰"
        />
        <StatCard
          label="Total Defaults"
          value={stats.totalDefaults.toString()}
          icon="⚠️"
        />
        <StatCard
          label="Protocol Fee"
          value={`${stats.protocolFeeBps / 100}%`}
          icon="💵"
        />
      </div>
    </section>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  )
}
