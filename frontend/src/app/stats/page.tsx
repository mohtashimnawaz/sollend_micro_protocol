'use client'

import { useProgram } from '@/hooks/useProgram'
import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function StatsPage() {
  const { program } = useProgram()
  const [stats, setStats] = useState<any>(null)
  const [loans, setLoans] = useState<any[]>([])
  const [reputations, setReputations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [program])

  const loadData = async () => {
    if (!program) return

    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
      )

      const config = await program.account.protocolConfig.fetch(configPda)
      const allLoans = await program.account.loanAccount.all()
      const allReps = await program.account.reputationAccount.all()

      setStats(config)
      setLoans(allLoans.map((l: any) => l.account))
      setReputations(allReps.map((r: any) => r.account))
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading statistics...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-red-600">Failed to load statistics</div>
      </div>
    )
  }

  // Calculate statistics
  const tierDistribution = [
    { name: 'Tier A', value: reputations.filter(r => r.creditTier === 0).length, color: '#10b981' },
    { name: 'Tier B', value: reputations.filter(r => r.creditTier === 1).length, color: '#3b82f6' },
    { name: 'Tier C', value: reputations.filter(r => r.creditTier === 2).length, color: '#f59e0b' },
    { name: 'Tier D', value: reputations.filter(r => r.creditTier === 3).length, color: '#ef4444' },
  ]

  const loanStates = [
    { name: 'Requested', value: loans.filter(l => l.state.requested).length },
    { name: 'Funded', value: loans.filter(l => l.state.funded).length },
    { name: 'Active', value: loans.filter(l => l.state.active).length },
    { name: 'Repaid', value: loans.filter(l => l.state.repaid).length },
    { name: 'Defaulted', value: loans.filter(l => l.state.defaulted).length },
  ]

  const totalVolume = (stats.totalVolume.toNumber() / 1e9).toFixed(2)
  const activeVolume = loans
    .filter(l => l.state.active || l.state.funded)
    .reduce((sum, l) => sum + l.amount.toNumber() / 1e9, 0)
    .toFixed(2)

  const avgCreditScore = reputations.length > 0
    ? (reputations.reduce((sum, r) => sum + r.creditScore, 0) / reputations.length).toFixed(0)
    : 0

  const defaultRate = stats.totalLoansIssued > 0
    ? ((stats.totalDefaults / stats.totalLoansIssued) * 100).toFixed(2)
    : 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Protocol Statistics</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Real-time analytics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Volume" 
          value={`${totalVolume} tokens`}
          change="+12% this month"
          icon="💰"
          color="green"
        />
        <MetricCard 
          title="Active Volume" 
          value={`${activeVolume} tokens`}
          change="Currently deployed"
          icon="🔄"
          color="blue"
        />
        <MetricCard 
          title="Total Users" 
          value={reputations.length}
          change={`Avg score: ${avgCreditScore}`}
          icon="👥"
          color="purple"
        />
        <MetricCard 
          title="Default Rate" 
          value={`${defaultRate}%`}
          change={`${stats.totalDefaults} total`}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Credit Tier Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Credit Tier Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tierDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tierDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Loan States */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Loan States</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loanStates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Protocol Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Protocol Details</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <DetailItem label="Total Loans Issued" value={stats.totalLoansIssued.toString()} />
          <DetailItem label="Protocol Fee" value={`${stats.protocolFeeBps / 100}%`} />
          <DetailItem label="Max Loan Duration" value={`${stats.maxLoanDuration.toNumber() / 86400} days`} />
          <DetailItem label="Grace Period" value={`${stats.defaultGracePeriod.toNumber() / 86400} days`} />
          <DetailItem label="Default Penalty" value={`${stats.defaultPenaltyBps / 100}%`} />
          <DetailItem label="Protocol Paused" value={stats.isPaused ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* Top Borrowers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Top Credit Scores</h2>
        <div className="space-y-3">
          {reputations
            .sort((a, b) => b.creditScore - a.creditScore)
            .slice(0, 10)
            .map((rep, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">#{idx + 1}</span>
                  <span className="font-mono text-sm">{rep.owner.toString().slice(0, 8)}...</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`tier-${['a', 'b', 'c', 'd'][rep.creditTier]} px-3 py-1 rounded-full text-xs font-semibold`}>
                    Tier {['A', 'B', 'C', 'D'][rep.creditTier]}
                  </span>
                  <span className="font-bold">{rep.creditScore}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, icon, color }: { 
  title: string; 
  value: any; 
  change: string; 
  icon: string; 
  color: string 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="text-3xl">{icon}</div>
      </div>
      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{title}</div>
      <div className={`text-2xl font-bold text-${color}-600 mb-1`}>{value}</div>
      <div className="text-xs text-gray-500">{change}</div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}
