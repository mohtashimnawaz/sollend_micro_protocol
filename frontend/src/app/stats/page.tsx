'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useProgram } from '@/hooks/useProgram'
import { useState, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import { ChartBarIcon, CurrencyDollarIcon, UserGroupIcon, BanknotesIcon } from '@heroicons/react/24/outline'

interface ProtocolStats {
  totalLoansIssued: number
  totalVolume: number
  totalDefaults: number
  isPaused: boolean
}

export default function StatsPage() {
  const wallet = useWallet()
  const { program } = useProgram()
  const [stats, setStats] = useState<ProtocolStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!program) {
      setError('Program not initialized. Please connect your wallet.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
      )

      const config = await program.account.protocolConfig.fetch(configPda)
      setStats({
        totalLoansIssued: config.totalLoansIssued.toNumber(),
        totalVolume: config.totalVolume.toNumber() / 1e9,
        totalDefaults: config.totalDefaults.toNumber(),
        isPaused: config.isPaused,
      })
    } catch (error: any) {
      console.error('Error fetching stats:', error)
      setError(error?.message || 'Failed to fetch protocol statistics. The protocol may not be initialized yet.')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (program) {
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program])

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-500 mb-8 drop-shadow-lg">
        Protocol Statistics
      </h1>

      {!wallet.connected ? (
        <div className="glass-dark p-12 rounded-3xl border border-white/10 text-center">
          <p className="text-2xl text-white font-bold mb-4">Connect Your Wallet</p>
          <p className="text-gray-100">Please connect your wallet to view protocol statistics.</p>
        </div>
      ) : loading ? (
        <div className="glass-dark p-12 rounded-3xl border border-white/10 text-center">
          <div className="inline-block w-12 h-12 border-4 bo60 to-blue-900/60 backdrop-blur-xl rounded-2xl border-2 border-cyan-400/40 p-6 hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <ChartBarIcon className="w-10 h-10 text-cyan-300" />
                <h3 className="text-lg font-bold text-cyan-200">Total Loans</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">{stats.totalLoansIssued}</p>
              <p className="text-gray-100 text-sm">Loans issued</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/60 to-teal-900/60 backdrop-blur-xl rounded-2xl border-2 border-emerald-400/40 p-6 hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <CurrencyDollarIcon className="w-10 h-10 text-emerald-300" />
                <h3 className="text-lg font-bold text-emerald-200">Total Volume</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">{stats.totalVolume.toFixed(2)}</p>
              <p className="text-gray-100 text-sm">SOL lent</p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/60 to-red-900/60 backdrop-blur-xl rounded-2xl border-2 border-orange-400/40 p-6 hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <BanknotesIcon className="w-10 h-10 text-orange-300" />
                <h3 className="text-lg font-bold text-orange-200">Defaults</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">{stats.totalDefaults}</p>
              <p className="text-gray-100 text-sm">Total defaults</p>
            </div>

            <div className={`bg-gradient-to-br ${stats.isPaused ? 'from-red-900/60 to-pink-900/60 border-red-400/40' : 'from-emerald-900/60 to-teal-900/60 border-emerald-400/40'} backdrop-blur-xl rounded-2xl border-2 p-6 hover:scale-105 transition-transform`}>
              <div className="flex items-center gap-3 mb-4">
                <UserGroupIcon className={`w-10 h-10 ${stats.isPaused ? 'text-red-300' : 'text-emerald-300'}`} />
                <h3 className={`text-lg font-bold ${stats.isPaused ? 'text-red-200' : 'text-emerald-200'}`}>Status</h3>
              </div>
              <p className={`text-3xl font-black mb-2 ${stats.isPaused ? 'text-red-300' : 'text-emerald-300'}`}>
                {stats.isPaused ? 'PAUSED' : 'ACTIVE'}
              </p>
              <p className="text-gray-100 text-sm">Protocol status</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-900/50 to-purple-900/50 backdrop-blur-xl rounded-2xl border-2 border-fuchsia-400/40 p-8">
            <h2 className="text-2xl font-bold text-fuchsia-200 mb-6">Performance Metrics</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-100 text-sm mb-2">Default Rate</p>
                <p className="text-3xl font-black text-white">
                  {stats.totalLoansIssued > 0 
                    ? ((stats.totalDefaults / stats.totalLoansIssued) * 100).toFixed(2)
                    : '0.00'}%
                </p>
              </div>
              <div>
                <p className="text-gray-100 text-sm mb-2">Average Loan Size</p>
                <p className="text-3xl font-black text-white">
                  {stats.totalLoansIssued > 0
                    ? (stats.totalVolume / stats.totalLoansIssued).toFixed(2)
                    : '0.00'} SOL
                </p>
              </div>
              <div>
                <p className="text-gray-100 text-sm mb-2">Success Rate</p>
                <p className="text-3xl font-black text-emerald-3t Rate</p>
                <p className="text-3xl font-black text-white">
                  {stats.totalLoansIssued > 0 
                    ? ((stats.totalDefaults / stats.totalLoansIssued) * 100).toFixed(2)
                    : '0.00'}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Average Loan Size</p>
                <p className="text-3xl font-black text-white">
                  {stats.totalLoansIssued > 0
                    ? (stats.totalVolume / stats.totalLoansIssued).toFixed(2)
                    : '0.00'} SOL
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Success Rate</p>
                <p className="text-3xl font-black text-emerald-400">
                  {stats.totalLoansIssued > 0
                    ? (((stats.totalLoansIssued - stats.totalDefaults) / stats.totalLoansIssued) * 100).toFixed(2)
                    : '100.00'}%
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-dark p-12 rounded-3xl border border-white/10 text-center">
          <p className="text-2xl text-white font-bold mb-4">No Data Available</p>
          <p className="text-gray-100">Protocol configuration not found or not initialized.</p>
        </div>
      )}
    </div>
  )
}
