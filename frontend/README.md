# Sollend Frontend

React/Next.js frontend for the Sollend Micro-Lending Protocol.

## Features

- 🏠 **Landing Page**: Protocol overview and statistics
- 💳 **Borrow Page**: Create reputation, request loans, manage credit
- 💰 **Lend Page**: Browse and fund loan requests
- 📊 **Dashboard**: View your loans and activity
- 📈 **Stats Page**: Protocol-wide analytics

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter
- Anchor Client

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
```

### 3. Copy IDL

The frontend needs the program IDL to interact with the smart contract:

```bash
# From the project root
cp target/idl/sollend_micro_protocol.json frontend/
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

### Home (`/`)
- Protocol overview
- Feature highlights
- Credit tier explanation
- How it works guide
- Protocol statistics

### Borrow (`/borrow`)
- Create reputation NFT
- View credit profile
- Create loan requests
- View borrowing history

### Lend (`/lend`)
- Browse loan requests
- Filter by credit tier
- Fund loans with custom rates
- Track investments

### Dashboard (`/dashboard`)
- Active loans
- Loan history
- Repayment management
- Credit score tracking

### Stats (`/stats`)
- Protocol-wide statistics
- Credit tier distribution
- Volume charts
- Default rates

## Key Components

### `WalletProvider`
Wraps app with Solana wallet context

### `Navigation`
Top navigation bar with wallet connect button

### `ProtocolStats`
Displays real-time protocol statistics

### Hooks

#### `useProgram`
Returns initialized Anchor program instance

#### `useReputation`
Manages user reputation (create, fetch, refresh)

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Static Export

```bash
# Add to next.config.js:
# output: 'export'

npm run build
# Deploy the 'out' directory
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network | `devnet` / `mainnet-beta` |
| `NEXT_PUBLIC_RPC_URL` | RPC endpoint | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_PROGRAM_ID` | Deployed program ID | `vig2E...` |

## Wallet Support

- Phantom
- Solflare
- (Easily extend with more adapters)

## Styling

- **Framework**: Tailwind CSS
- **Theme**: Light/Dark mode support
- **Components**: Custom utility classes for tiers and states

## Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced filtering and search
- [ ] Loan analytics charts
- [ ] Mobile-responsive improvements
- [ ] Multi-language support
- [ ] Email notifications
- [ ] Activity feed

## Troubleshooting

### Wallet not connecting
- Ensure wallet extension is installed
- Check network matches (devnet/mainnet)
- Clear browser cache

### Program not found
- Verify `NEXT_PUBLIC_PROGRAM_ID` is correct
- Ensure program is deployed to selected network
- Check IDL file is present

### Transaction errors
- Ensure wallet has SOL for fees
- Check program state (not paused)
- Verify account permissions

## Contributing

See main project [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT
