# Quick Start Guide

Get up and running with Sollend Micro-Lending Protocol in 10 minutes!

## Prerequisites Check

```bash
# Check Rust
rustc --version  # Should be 1.70.0+

# Check Solana
solana --version  # Should be 1.17.0+

# Check Anchor
anchor --version  # Should be 0.29.0+

# Check Node
node --version  # Should be v16+
```

If any are missing, see [README.md](README.md#prerequisites) for installation.

## Step 1: Build the Program

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# This creates:
# ✓ target/deploy/sollend_micro_protocol.so
# ✓ target/idl/sollend_micro_protocol.json
# ✓ target/types/sollend_micro_protocol.ts
```

## Step 2: Get Program ID

```bash
# Extract program ID
solana address -k target/deploy/sollend_micro_protocol-keypair.json

# Copy this ID!
```

## Step 3: Update Program ID

Update in **TWO** places:

**File 1:** `programs/sollend_micro_protocol/src/lib.rs`
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**File 2:** `Anchor.toml`
```toml
[programs.localnet]
sollend_micro_protocol = "YOUR_PROGRAM_ID_HERE"
```

## Step 4: Rebuild

```bash
anchor build
```

## Step 5: Start Local Validator

```bash
# Terminal 1: Start validator
solana-test-validator

# Keep this running!
```

## Step 6: Deploy Locally

```bash
# Terminal 2: Deploy
anchor deploy

# You should see: "Program Id: YOUR_PROGRAM_ID"
```

## Step 7: Run Tests

```bash
# Run the full test suite
anchor test --skip-local-validator

# ✅ Should see all tests passing!
```

## Step 8: Initialize Protocol

```bash
# Generate keypairs
solana-keygen new -o admin-keypair.json
solana-keygen new -o oracle-keypair.json

# Initialize protocol
yarn initialize

# You should see: "🎉 Protocol is ready to use!"
```

## Step 9: Set Up Oracle (Optional)

```bash
cd oracle

# Install dependencies
npm install

# Copy env template
cp .env.example .env

# Edit .env
nano .env
# Set ORACLE_KEYPAIR_PATH to ../oracle-keypair.json

# Start oracle in dev mode
npm run dev

# Should see: "✅ Oracle Service Started Successfully"
```

## Step 10: Verify Everything

```bash
# Back to root directory
cd ..

# Run verification
yarn verify

# Should see: "✅ ALL CHECKS PASSED!"

# View stats
yarn stats
```

## 🎉 Success!

You now have a fully functional micro-lending protocol running locally!

## What's Next?

### Try It Out

Create a borrower and test the flow:

```typescript
// See tests/sollend_micro_protocol.ts for full examples

// 1. Create reputation
await createReputation(borrowerKeypair);

// 2. Create loan request
await createLoanRequest(10_000_000_000, 30_days, 15%);

// 3. Fund loan (as lender)
await fundLoan(10%);

// 4. Withdraw funds (as borrower)
await withdrawLoan();

// 5. Repay loan
await repayLoan();

// 6. Check new credit score!
```

### Deploy to Devnet

```bash
# Configure for devnet
solana config set --url https://api.devnet.solana.com

# Airdrop SOL
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet

# Initialize
SOLANA_NETWORK=devnet yarn initialize

# Update oracle/.env with devnet URL
cd oracle
# Edit .env: SOLANA_RPC_URL=https://api.devnet.solana.com

# Start oracle
npm run dev
```

### Build a Frontend

Create a React app:

```bash
npx create-react-app sollend-app
cd sollend-app

# Install Solana dependencies
npm install @solana/web3.js @coral-xyz/anchor \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-wallets \
  @solana/wallet-adapter-react-ui

# Copy IDL
cp ../target/idl/sollend_micro_protocol.json src/

# Start building!
```

### Key Components to Build

1. **Borrower Dashboard**
   - Credit score display
   - Loan request form
   - Active loans list
   - Repayment interface

2. **Lender Dashboard**
   - Browse loan requests
   - Filter by credit tier
   - Fund loans
   - Track investments

3. **Analytics**
   - Protocol stats
   - Borrower rankings
   - Default rates
   - Volume charts

## Useful Commands

```bash
# View logs
solana logs

# Check account
solana account YOUR_ACCOUNT_ADDRESS

# Get balance
solana balance

# Transfer SOL
solana transfer RECIPIENT_ADDRESS 1

# View protocol stats
yarn stats

# Verify deployment
yarn verify

# Run specific test
anchor test --skip-local-validator -- --grep "repay"
```

## Common Issues

### "Program not deployed"
```bash
# Make sure validator is running
solana-test-validator

# Redeploy
anchor deploy
```

### "IDL not found"
```bash
# Rebuild
anchor build
```

### "Insufficient funds"
```bash
# Check balance
solana balance

# Airdrop more
solana airdrop 2
```

### "Account already exists"
```bash
# Use a different loan_id or borrower
```

### Tests fail with "PDA mismatch"
```bash
# Make sure program ID is updated everywhere
grep -r "YOUR_OLD_ID" .

# Rebuild
anchor clean
anchor build
```

## Learning Resources

- 📚 [Full Documentation](README.md)
- 🔧 [API Reference](API.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🧪 [Test Examples](tests/sollend_micro_protocol.ts)
- 🤖 [Oracle Service](oracle/src/index.ts)

## Getting Help

- Check logs: `solana logs`
- Read error messages carefully
- Search Anchor documentation
- Review test files for examples
- Check Solana Stack Exchange

## Architecture Recap

```
┌─────────────────────────────────────────┐
│         Sollend Protocol                │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐      ┌──────────┐       │
│  │Reputation│      │  Loans   │       │
│  │   NFT    │◄────►│  (PDAs)  │       │
│  └──────────┘      └──────────┘       │
│       │                  │             │
│       │                  │             │
│  ┌────▼──────────────────▼────┐       │
│  │    Credit Score Engine     │       │
│  └────────────────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
              ▲
              │
        ┌─────┴─────┐
        │  Oracle   │
        │  Service  │
        └───────────┘
```

## Next Steps Checklist

- [ ] ✅ Local deployment working
- [ ] ✅ Tests passing
- [ ] ✅ Protocol initialized
- [ ] ✅ Oracle running
- [ ] 🚀 Deploy to devnet
- [ ] 🎨 Build frontend
- [ ] 📊 Add analytics
- [ ] 🔒 Security audit
- [ ] 🌐 Deploy to mainnet

---

**Time to build something amazing! 🚀**

Questions? Check the [README](README.md) or [API docs](API.md).
