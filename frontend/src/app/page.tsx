'use client'

import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { ProtocolStats } from '@/components/ProtocolStats'

export default function Home() {
  const { connected } = useWallet()

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Sollend
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Build your on-chain credit score and access micro-loans without collateral.
          Lend directly to borrowers and earn competitive returns.
        </p>
        
        {!connected ? (
          <div className="space-x-4">
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
              Connect Wallet to Get Started
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link href="/borrow" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Borrow
            </Link>
            <Link href="/lend" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Lend
            </Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon="🏦"
          title="No Collateral Required"
          description="Borrow based on your reputation, not your assets. Build credit through successful repayments."
        />
        <FeatureCard
          icon="📈"
          title="Dynamic Credit Scoring"
          description="Your on-chain credit score (0-1000) determines your interest rates and borrowing limits."
        />
        <FeatureCard
          icon="🤝"
          title="P2P Marketplace"
          description="Lenders choose borrowers based on credit tiers. Direct matching, transparent terms."
        />
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Step
            number="1"
            title="Create Profile"
            description="Mint your Soulbound reputation NFT. Start with a credit score of 500 (Tier C)."
          />
          <Step
            number="2"
            title="Request Loan"
            description="Submit a loan request with amount, duration, and max interest rate you'll accept."
          />
          <Step
            number="3"
            title="Get Funded"
            description="Lenders review and fund your loan. Funds held in secure escrow until withdrawal."
          />
          <Step
            number="4"
            title="Build Credit"
            description="Repay on time to increase your score (+50). Better credit = better rates!"
          />
        </div>
      </section>

      {/* Credit Tiers */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Credit Tier System
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <TierCard
            tier="A"
            score="800-1000"
            rate="5%"
            limit="100"
            color="green"
          />
          <TierCard
            tier="B"
            score="600-799"
            rate="7%"
            limit="50"
            color="blue"
          />
          <TierCard
            tier="C"
            score="400-599"
            rate="10%"
            limit="25"
            color="yellow"
          />
          <TierCard
            tier="D"
            score="0-399"
            rate="15%"
            limit="10"
            color="red"
          />
        </div>
      </section>

      {/* Protocol Stats */}
      <ProtocolStats />

      {/* CTA */}
      {connected && (
        <section className="text-center py-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create your reputation profile and start building credit today.
          </p>
          <Link href="/borrow" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
            Create Your Profile
          </Link>
        </section>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-xl mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

function TierCard({ tier, score, rate, limit, color }: { tier: string; score: string; rate: string; limit: string; color: string }) {
  const colorClasses = {
    green: 'bg-green-50 border-green-300 dark:bg-green-900/20',
    blue: 'bg-blue-50 border-blue-300 dark:bg-blue-900/20',
    yellow: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20',
    red: 'bg-red-50 border-red-300 dark:bg-red-900/20',
  }

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Tier {tier}</h3>
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Score: {score}</div>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Interest Rate</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{rate}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Max Borrow</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{limit} tokens</div>
          </div>
        </div>
      </div>
    </div>
  )
}
