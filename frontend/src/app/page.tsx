import Link from 'next/link'
import { 
  SparklesIcon, 
  ShieldCheckIcon, 
  BoltIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="space-y-20 py-12">
      {/* Hero Section - Mauryan Amber & Sandstone */}
      <section className="text-center space-y-8 py-20">
        <div className="space-y-6">
          <h1 className="text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 animate-gradient leading-tight drop-shadow-2xl">
            Sollend
          </h1>
          <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-300 to-amber-500 bg-clip-text text-transparent drop-shadow-lg">
            Reputation-Based Micro-Lending on Solana
          </p>
          <p className="text-lg lg:text-xl text-gray-100 max-w-3xl mx-auto font-medium">
            Build your credit on-chain, access instant liquidity, and earn yield without traditional barriers
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-8">
          <Link 
            href="/borrow" 
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-700 text-white text-lg font-bold rounded-xl shadow-2xl hover:shadow-amber-500/50 transition-all hover:scale-105"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">Start Borrowing</span>
            <BoltIcon className="relative w-6 h-6" />
          </Link>

          <Link 
            href="/lend" 
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-white text-lg font-bold rounded-xl shadow-2xl hover:shadow-yellow-500/50 transition-all hover:scale-105"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">Earn Yield</span>
            <ChartBarIcon className="relative w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Features Grid - Mauryan Palette */}
      <section className="space-y-12">
        <h2 className="text-3xl lg:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 drop-shadow-lg">
          Why Sollend?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="group p-8 bg-gradient-to-br from-amber-900/60 to-yellow-900/60 backdrop-blur-xl rounded-2xl border-2 border-amber-400/40 hover:border-amber-300/70 transition-all hover:scale-105 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/50">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-amber-200 mb-4">Credit Score System</h3>
            <p className="text-gray-100 leading-relaxed">
              Build your on-chain reputation with our dynamic credit scoring algorithm. Your history matters.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-orange-900/60 to-amber-900/60 backdrop-blur-xl rounded-2xl border-2 border-orange-400/40 hover:border-orange-300/70 transition-all hover:scale-105 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/50">
              <BoltIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-orange-200 mb-4">Instant Liquidity</h3>
            <p className="text-gray-100 leading-relaxed">
              Get access to funds in seconds. No paperwork, no waiting. Just connect your wallet and borrow.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-yellow-900/60 to-orange-900/60 backdrop-blur-xl rounded-2xl border-2 border-yellow-400/40 hover:border-yellow-300/70 transition-all hover:scale-105 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-yellow-500/50">
              <CurrencyDollarIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-200 mb-4">Flexible Terms</h3>
            <p className="text-gray-100 leading-relaxed">
              Choose your loan amount, duration, and collateral. Personalized terms based on your credit tier.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Mauryan Steps */}
      <section className="space-y-12 p-8 lg:p-12 bg-gradient-to-br from-amber-900/50 to-orange-900/50 backdrop-blur-xl rounded-3xl border-2 border-amber-400/40">
        <h2 className="text-3xl lg:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 drop-shadow-lg">
          How It Works
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Connect Wallet', desc: 'Link your Solana wallet to get started', color: 'from-amber-500 to-yellow-600', border: 'border-amber-300', text: 'text-amber-200' },
            { step: '02', title: 'Check Credit', desc: 'View your on-chain credit score and tier', color: 'from-yellow-500 to-orange-600', border: 'border-yellow-300', text: 'text-yellow-200' },
            { step: '03', title: 'Request Loan', desc: 'Choose amount, duration, and collateral', color: 'from-orange-500 to-amber-600', border: 'border-orange-300', text: 'text-orange-200' },
            { step: '04', title: 'Get Funded', desc: 'Receive funds instantly from lenders', color: 'from-amber-600 to-orange-700', border: 'border-amber-400', text: 'text-amber-200' },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-4">
              <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-2xl border-4 ${item.border}`}>
                {item.step}
              </div>
              <h3 className={`text-xl font-bold ${item.text}`}>{item.title}</h3>
              <p className="text-gray-100 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Credit Tiers - Mauryan Metal Gradation */}
      <section className="space-y-12">
        <h2 className="text-3xl lg:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 drop-shadow-lg">
          Credit Tiers
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { tier: 'A', name: 'Platinum', score: '750+', ltv: '80%', rate: '5%', gradient: 'from-amber-400 to-yellow-500', bg: 'from-amber-900/60 to-yellow-900/60', border: 'border-amber-300/60', text: 'text-amber-200' },
            { tier: 'B', name: 'Gold', score: '650-749', ltv: '70%', rate: '8%', gradient: 'from-yellow-400 to-amber-500', bg: 'from-yellow-900/60 to-amber-900/60', border: 'border-yellow-300/60', text: 'text-yellow-200' },
            { tier: 'C', name: 'Silver', score: '550-649', ltv: '60%', rate: '12%', gradient: 'from-orange-400 to-amber-600', bg: 'from-orange-900/60 to-amber-900/60', border: 'border-orange-300/60', text: 'text-orange-200' },
            { tier: 'D', name: 'Bronze', score: '< 550', ltv: '50%', rate: '15%', gradient: 'from-amber-600 to-orange-700', bg: 'from-amber-900/60 to-orange-900/60', border: 'border-amber-400/60', text: 'text-amber-300' },
          ].map((item) => (
            <div key={item.tier} className={`group p-6 bg-gradient-to-br ${item.bg} backdrop-blur-xl rounded-2xl border-2 ${item.border} hover:border-opacity-100 transition-all hover:scale-105 shadow-2xl`}>
              <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center text-3xl font-black text-white mb-4 shadow-2xl border-4 border-white/30`}>
                {item.tier}
              </div>
              <h3 className={`text-2xl font-bold ${item.text} text-center mb-2`}>{item.name}</h3>
              <p className="text-gray-100 text-center text-sm mb-4 font-semibold">Score: {item.score}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-200">Max LTV:</span>
                  <span className="text-white font-bold">{item.ltv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">APR:</span>
                  <span className="text-white font-bold">{item.rate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats - Mauryan Treasury Metrics */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          { label: 'Total Value Locked', value: '$12.5M', icon: CurrencyDollarIcon, gradient: 'from-amber-300 to-yellow-500', bg: 'from-amber-900/60 to-yellow-900/60', border: 'border-amber-400/60', iconColor: 'text-amber-300' },
          { label: 'Active Loans', value: '1,234', icon: ChartBarIcon, gradient: 'from-orange-300 to-amber-600', bg: 'from-orange-900/60 to-amber-900/60', border: 'border-orange-400/60', iconColor: 'text-orange-300' },
          { label: 'Total Users', value: '5,678', icon: UserGroupIcon, gradient: 'from-yellow-300 to-orange-500', bg: 'from-yellow-900/60 to-orange-900/60', border: 'border-yellow-400/60', iconColor: 'text-yellow-300' },
        ].map((stat) => (
          <div key={stat.label} className={`p-8 bg-gradient-to-br ${stat.bg} backdrop-blur-xl rounded-2xl border-2 ${stat.border} text-center space-y-4 hover:scale-105 transition-transform shadow-2xl`}>
            <stat.icon className={`w-12 h-12 mx-auto ${stat.iconColor}`} />
            <div className={`text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient} drop-shadow-lg`}>
              {stat.value}
            </div>
            <div className="text-gray-100 text-lg font-semibold">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* CTA Section - Mauryan Royal Saffron */}
      <section className="relative overflow-hidden rounded-3xl p-16 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-center space-y-8 shadow-2xl border-4 border-amber-400/50">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{ backgroundImage: 'url(/grid.svg)', backgroundSize: '30px 30px' }}></div>
        </div>
        
        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-black text-white drop-shadow-2xl">
            Ready to Get Started?
          </h2>
          <p className="text-2xl text-white font-bold max-w-2xl mx-auto">
            Join thousands of users building their credit on-chain
          </p>
          
          <Link 
            href="/borrow" 
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-amber-700 text-xl font-black rounded-xl shadow-2xl hover:shadow-white/80 transition-all hover:scale-110 border-4 border-amber-200"
          >
            Launch App
            <SparklesIcon className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  )
}
