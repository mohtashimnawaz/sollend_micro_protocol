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
      {/* Hero Section - Cyan to Pink Gradient */}
      <section className="text-center space-y-8 py-20">
        <div className="space-y-6">
          <h1 className="text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 animate-gradient leading-tight drop-shadow-2xl">
            Sollend
          </h1>
          <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-300 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
            Reputation-Based Micro-Lending on Solana
          </p>
          <p className="text-lg lg:text-xl text-gray-100 max-w-3xl mx-auto font-medium">
            Build your credit on-chain, access instant liquidity, and earn yield without traditional barriers
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-8">
          <Link 
            href="/borrow" 
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">Start Borrowing</span>
            <BoltIcon className="relative w-6 h-6" />
          </Link>

          <Link 
            href="/lend" 
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white text-lg font-bold rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all hover:scale-105"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">Earn Yield</span>
            <ChartBarIcon className="relative w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Features Grid - Multi-color Cards */}
      <section className="space-y-12">
        <h2 className="text-3xl lg:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-500 drop-shadow-lg">
          Why Sollend?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="group p-8 bg-gradient-to-br from-cyan-900/60 to-blue-900/60 backdrop-blur-xl rounded-2xl border-2 border-cyan-400/40 hover:border-cyan-300/70 transition-all hover:scale-105 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/50">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-cyan-200 mb-4">Credit Score System</h3>
            <p className="text-gray-100 leading-relaxed">
              Build your on-chain reputation with our dynamic credit scoring algorithm. Your history matters.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-emerald-900/60 to-teal-900/60 backdrop-blur-xl rounded-2xl border-2 border-emerald-400/40 hover:border-emerald-300/70 transition-all hover:scale-105 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/50">
              <BoltIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-200 mb-4">Instant Liquidity</h3>
            <p className="text-gray-100 leading-relaxed">
              Get access to funds in seconds. No paperwork, no waiting. Just connect your wallet and borrow.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-orange-900/60 to-red-900/60 backdrop-blur-xl rounded-2xl border-2 border-orange-400/40 hover:border-orange-300/70 transition-all hover:scale-105 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/50">
              <CurrencyDollarIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-orange-200 mb-4">Flexible Terms</h3>
            <p className="text-gray-100 leading-relaxed">
              Choose your loan amount, duration, and collateral. Personalized terms based on your credit tier.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Vibrant Steps */}
      <section className="space-y-12 p-8 lg:p-12 bg-gradient-to-br from-fuchsia-900/50 to-purple-900/50 backdrop-blur-xl rounded-3xl border-2 border-fuchsia-400/40">
        <h2 className="text-3xl lg:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-pink-500 drop-shadow-lg">
          How It Works
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Connect Wallet', desc: 'Link your Solana wallet to get started', color: 'from-cyan-400 to-blue-500', border: 'border-cyan-300', text: 'text-cyan-200' },
            { step: '02', title: 'Check Credit', desc: 'View your on-chain credit score and tier', color: 'from-emerald-400 to-teal-500', border: 'border-emerald-300', text: 'text-emerald-200' },
            { step: '03', title: 'Request Loan', desc: 'Choose amount, duration, and collateral', color: 'from-orange-400 to-red-500', border: 'border-orange-300', text: 'text-orange-200' },
            { step: '04', title: 'Get Funded', desc: 'Receive funds instantly from lenders', color: 'from-fuchsia-400 to-pink-500', border: 'border-fuchsia-300', text: 'text-fuchsia-200' },
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

      {/* Credit Tiers - Distinct Color-Coded Cards */}
      <section className="space-y-12">
        <h2 className="text-3xl lg:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 drop-shadow-lg">
          Credit Tiers
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { tier: 'A', name: 'Platinum', score: '750+', ltv: '80%', rate: '5%', gradient: 'from-emerald-400 to-teal-500', bg: 'from-emerald-900/60 to-teal-900/60', border: 'border-emerald-300/60', text: 'text-emerald-200' },
            { tier: 'B', name: 'Gold', score: '650-749', ltv: '70%', rate: '8%', gradient: 'from-cyan-400 to-blue-500', bg: 'from-cyan-900/60 to-blue-900/60', border: 'border-cyan-300/60', text: 'text-cyan-200' },
            { tier: 'C', name: 'Silver', score: '550-649', ltv: '60%', rate: '12%', gradient: 'from-yellow-400 to-orange-500', bg: 'from-yellow-900/60 to-orange-900/60', border: 'border-yellow-300/60', text: 'text-yellow-200' },
            { tier: 'D', name: 'Bronze', score: '< 550', ltv: '50%', rate: '15%', gradient: 'from-orange-400 to-red-500', bg: 'from-orange-900/60 to-red-900/60', border: 'border-orange-300/60', text: 'text-orange-200' },
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

      {/* Stats - Colorful Metric Cards */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          { label: 'Total Value Locked', value: '$12.5M', icon: CurrencyDollarIcon, gradient: 'from-cyan-300 to-blue-500', bg: 'from-cyan-900/60 to-blue-900/60', border: 'border-cyan-400/60', iconColor: 'text-cyan-300' },
          { label: 'Active Loans', value: '1,234', icon: ChartBarIcon, gradient: 'from-emerald-300 to-teal-500', bg: 'from-emerald-900/60 to-teal-900/60', border: 'border-emerald-400/60', iconColor: 'text-emerald-300' },
          { label: 'Total Users', value: '5,678', icon: UserGroupIcon, gradient: 'from-fuchsia-300 to-pink-500', bg: 'from-fuchsia-900/60 to-pink-900/60', border: 'border-fuchsia-400/60', iconColor: 'text-fuchsia-300' },
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

      {/* CTA Section - High Contrast Orange-Pink Gradient */}
      <section className="relative overflow-hidden rounded-3xl p-16 bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-center space-y-8 shadow-2xl border-4 border-orange-400/50">
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
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-orange-600 text-xl font-black rounded-xl shadow-2xl hover:shadow-white/80 transition-all hover:scale-110 border-4 border-orange-200"
          >
            Launch App
            <SparklesIcon className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  )
}
