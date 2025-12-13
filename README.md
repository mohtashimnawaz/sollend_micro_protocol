# Sollend Micro-Lending Protocol

A decentralized, reputation-based micro-lending platform built on Solana that enables peer-to-peer lending without requiring over-collateralization.

## 🎯 Overview

Sollend revolutionizes micro-lending by:
- **Reputation-Based Credit**: Each borrower has a non-transferable Soulbound Token (SBT) tracking their credit history
- **Dynamic Credit Scoring**: Interest rates and borrowing limits adjust based on repayment behavior
- **P2P Marketplace**: Lenders choose borrowers based on credit tiers and risk profiles
- **On-Chain Credit History**: Transparent, immutable loan history and credit scores

## 🏗️ Architecture

### Core Components

#### 1. **Reputation NFT (Soulbound Token)**
- Non-transferable credit profile for each borrower
- Tracks credit score (0-1000), credit tier (A/B/C/D), and loan history
- Updates automatically based on repayment behavior
- Frozen upon default to prevent new borrowing

#### 2. **Credit Tier System**
| Tier | Score Range | Base Rate | Max Borrow |
|------|-------------|-----------|------------|
| A    | 800-1000    | 5%        | 100 tokens |
| B    | 600-799     | 7%        | 50 tokens  |
| C    | 400-599     | 10%       | 25 tokens  |
| D    | 0-399       | 15%       | 10 tokens  |

#### 3. **Loan Lifecycle**
```
Request → Fund → Active → Repaid
                      ↓
                  Defaulted
```

#### 4. **Oracle Service**
- Monitors active loans for defaults
- Automatically marks overdue loans as defaulted
- Applies credit score penalties
- Runs as a background service with configurable intervals

## 📦 Program Structure

### Account Types

#### `ProtocolConfig` (PDA)
- Protocol-wide settings and statistics
- Admin and oracle authorities
- Total loans, volume, and defaults
- Protocol fee configuration

#### `ReputationAccount` (PDA)
- Borrower's credit profile
- Credit score and tier
- Loan statistics (completed, defaulted, etc.)
- On-time vs. late payment tracking
- Freeze status

#### `LoanAccount` (PDA)
- Individual loan details
- Borrower, lender, amount, duration
- Interest rates (suggested, max, actual)
- Loan state and timestamps
- Repayment information

#### `EscrowAccount` (PDA)
- Holds lender funds during loan lifecycle
- PDA authority for secure transfers

### Instructions

#### Protocol Management
- `initialize_config`: Set up protocol with admin and oracle
- `update_config`: Modify protocol parameters (admin only)

#### Reputation
- `create_reputation`: Mint Soulbound Token for new borrower
- `unfreeze_reputation`: Rehabilitate defaulted borrower (admin only)

#### Loan Operations
- `create_loan_request`: Borrower creates loan request
- `fund_loan`: Lender funds loan with agreed interest rate
- `withdraw_loan`: Borrower withdraws funded loan
- `repay_loan`: Borrower repays principal + interest
- `mark_default`: Oracle marks overdue loan as defaulted
- `cancel_loan_request`: Borrower cancels unfunded request

## 🚀 Getting Started

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Node.js dependencies
npm install -g yarn
```

### Build the Program

```bash
# Clone and navigate to project
cd sollend_micro_protocol

# Install dependencies
yarn install

# Build the program
anchor build

# Generate TypeScript types
anchor build

# Get program ID
solana address -k target/deploy/sollend_micro_protocol-keypair.json
```

Update the program ID in:
- `Anchor.toml`: `[programs.localnet]` section
- `lib.rs`: `declare_id!` macro

Rebuild after updating:
```bash
anchor build
```

### Deploy

#### Local Testing (Localnet)
```bash
# Start local validator
solana-test-validator

# In another terminal, deploy
anchor deploy

# Run tests
anchor test --skip-local-validator
```

#### Devnet Deployment
```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Airdrop SOL for deployment
solana airdrop 2

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Update Anchor.toml with devnet program ID
```

#### Mainnet Deployment
```bash
# Configure for mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Deploy (ensure wallet has sufficient SOL)
anchor deploy --provider.cluster mainnet
```

## 🔧 Oracle Service Setup

The oracle monitors loans and marks defaults automatically.

### Installation

```bash
cd oracle
npm install
```

### Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Configure `.env`:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
ORACLE_KEYPAIR_PATH=/path/to/oracle-keypair.json
PROGRAM_ID=<your_program_id>
CHECK_INTERVAL_MINUTES=5
GRACE_PERIOD_MINUTES=60
LOG_LEVEL=info
```

3. Generate oracle keypair:
```bash
solana-keygen new -o oracle-keypair.json
```

4. Update protocol config with oracle authority:
```typescript
// Using Anchor client
await program.methods
  .updateConfig(
    oraclePublicKey,  // Oracle authority
    150,              // Protocol fee (1.5%)
    false             // Not paused
  )
  .accounts({
    config: configPda,
    authority: adminKeypair.publicKey,
  })
  .signers([adminKeypair])
  .rpc();
```

### Running the Oracle

```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start

# Using PM2 for production
npm install -g pm2
pm2 start dist/index.js --name sollend-oracle
pm2 save
pm2 startup
```

## 🧪 Testing

### Run Full Test Suite

```bash
# Run all tests
anchor test

# Run specific test file
anchor test tests/sollend_micro_protocol.ts

# Run with detailed logs
ANCHOR_LOG=true anchor test
```

### Test Coverage

The test suite covers:
- ✅ Protocol initialization and configuration
- ✅ Reputation NFT creation
- ✅ Loan request creation with tier-based limits
- ✅ Loan funding and escrow
- ✅ Loan withdrawal
- ✅ On-time repayment and credit score improvement
- ✅ Late payment penalties
- ✅ Default detection and reputation freezing
- ✅ Admin rehabilitation (unfreeze)
- ✅ Interest rate calculations by tier
- ✅ Protocol statistics tracking

## 💡 Usage Examples

### Initialize Protocol

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

const provider = anchor.AnchorProvider.env();
const program = anchor.workspace.SollendMicroProtocol;

// Initialize protocol config
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

await program.methods
  .initializeConfig(
    oracleAuthority,  // Oracle public key
    100               // 1% protocol fee
  )
  .accounts({
    config: configPda,
    authority: admin.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([admin])
  .rpc();
```

### Create Borrower Reputation

```typescript
const [reputationPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("reputation"), borrower.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .createReputation()
  .accounts({
    reputation: reputationPda,
    owner: borrower.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([borrower])
  .rpc();

// Check reputation
const reputation = await program.account.reputationAccount.fetch(reputationPda);
console.log("Credit Score:", reputation.creditScore); // 500
console.log("Credit Tier:", reputation.creditTier);   // 2 (Tier C)
```

### Request a Loan

```typescript
const loanId = new BN(1);
const amount = new BN(10_000_000_000); // 10 tokens
const duration = new BN(86400 * 30);   // 30 days
const maxInterest = 1500;              // 15% max

const [loanPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("loan"),
    borrower.publicKey.toBuffer(),
    loanId.toArrayLike(Buffer, "le", 8),
  ],
  program.programId
);

await program.methods
  .createLoanRequest(loanId, amount, duration, maxInterest)
  .accounts({
    loan: loanPda,
    borrowerReputation: reputationPda,
    config: configPda,
    borrower: borrower.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([borrower])
  .rpc();
```

### Fund a Loan (Lender)

```typescript
const interestRate = 1000; // 10%

const [escrowPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("escrow"),
    borrower.publicKey.toBuffer(),
    loanId.toArrayLike(Buffer, "le", 8),
  ],
  program.programId
);

await program.methods
  .fundLoan(interestRate)
  .accounts({
    loan: loanPda,
    escrow: escrowPda,
    borrowerReputation: reputationPda,
    config: configPda,
    configAccount: configPda,
    borrower: borrower.publicKey,
    lender: lender.publicKey,
    lenderTokenAccount,
    escrowTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([lender])
  .rpc();
```

### Repay Loan

```typescript
await program.methods
  .repayLoan()
  .accounts({
    loan: loanPda,
    borrowerReputation: reputationPda,
    config: configPda,
    borrower: borrower.publicKey,
    borrowerTokenAccount,
    lenderTokenAccount,
    protocolTreasury,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([borrower])
  .rpc();

// Check updated reputation
const updatedReputation = await program.account.reputationAccount.fetch(reputationPda);
console.log("New Score:", updatedReputation.creditScore);
console.log("Completed Loans:", updatedReputation.completedLoans);
```

## 📊 Credit Scoring System

### Score Adjustments

| Event | Score Change |
|-------|--------------|
| On-time payment | +50 |
| Late payment | -30 |
| Default | -150 |

### Tier Calculation

```rust
fn calculate_credit_tier(score: u16) -> u8 {
    if score >= 800 { TIER_A }
    else if score >= 600 { TIER_B }
    else if score >= 400 { TIER_C }
    else { TIER_D }
}
```

### Interest Rate Formula

```
Interest Rate = Base Rate + Risk Premium + Duration Factor

Where:
- Base Rate = 5%
- Risk Premium = Tier-based (A: 0%, B: 2%, C: 5%, D: 10%)
- Duration Factor = 0.1% per month
```

## 🔒 Security Features

### Anti-Sybil Measures
- One reputation NFT per wallet
- Reputation is non-transferable (Soulbound)
- Credit score decay for inactive accounts (future feature)
- Loan caps per credit tier

### Access Controls
- Admin-only protocol configuration
- Oracle-only default marking
- Borrower-only loan requests
- Lender choice in funding

### Escrow Safety
- PDA-controlled token accounts
- Atomic transfers
- No intermediate custody

### Reputation Integrity
- Automatic score updates
- Frozen accounts after default
- Admin rehabilitation pathway

## 🎯 Future Enhancements

### Phase 2: Advanced Features
- [ ] Partial loan funding (multiple lenders per loan)
- [ ] Loan refinancing
- [ ] Credit score decay for inactivity
- [ ] Secondary market for loan NFTs
- [ ] Borrower insurance pool

### Phase 3: DAO Governance
- [ ] Governance token for protocol decisions
- [ ] Community-driven credit tier adjustments
- [ ] Protocol fee voting
- [ ] Lender staking for insurance fund

### Phase 4: DeFi Integration
- [ ] Collateralized loans (hybrid model)
- [ ] Integration with other DeFi protocols
- [ ] Cross-chain reputation bridging
- [ ] Reputation-based derivatives

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

- Documentation: See `/docs` folder
- Issues: GitHub Issues
- Community: Discord (TBD)

## ⚠️ Disclaimer

This protocol is experimental software. Use at your own risk. The protocol has not been audited. Do not use with funds you cannot afford to lose.

---

**Built with ❤️ on Solana**
