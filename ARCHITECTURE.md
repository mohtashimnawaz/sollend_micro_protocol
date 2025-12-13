# System Architecture

## Overview

Sollend is a decentralized reputation-based micro-lending protocol on Solana that enables P2P lending without requiring over-collateralization.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Borrower   │  │    Lender    │  │   Analytics/Admin  │   │
│  │   Dashboard  │  │   Dashboard  │  │      Dashboard     │   │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘   │
│         │                 │                     │               │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          │   ┌─────────────▼─────────────────────▼──┐
          │   │   Solana Wallet Adapter              │
          └──►│   (Phantom, Solflare, etc.)          │
              └─────────────┬────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    Solana Blockchain Layer                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Sollend Protocol (On-Chain Program)              │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │ Instructions │  │   Accounts    │  │    Logic      │  │ │
│  │  │              │  │   (PDAs)      │  │               │  │ │
│  │  │ • init       │  │ • Config      │  │ • Scoring     │  │ │
│  │  │ • create_rep │  │ • Reputation  │  │ • Interest    │  │ │
│  │  │ • create_loan│  │ • Loan        │  │ • Validation  │  │ │
│  │  │ • fund       │  │ • Escrow      │  │               │  │ │
│  │  │ • withdraw   │  │               │  │               │  │ │
│  │  │ • repay      │  │               │  │               │  │ │
│  │  │ • default    │  │               │  │               │  │ │
│  │  └──────────────┘  └──────────────┘  └───────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   SPL Token Program                        │ │
│  │              (For token transfers/escrow)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                                ▲
                                │
┌───────────────────────────────┴────────────────────────────────┐
│                      Off-Chain Layer                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   Oracle Service                         │ │
│  │                                                          │ │
│  │  • Monitors active loans                                │ │
│  │  • Detects defaults (past due date + grace period)     │ │
│  │  • Triggers mark_default instruction                    │ │
│  │  • Applies credit score penalties                       │ │
│  │  • Runs on configurable interval (cron)                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  Indexer (Future)                        │ │
│  │                                                          │ │
│  │  • Index all protocol events                            │ │
│  │  • Provide fast queries for UI                          │ │
│  │  • Analytics aggregation                                │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Loan Request Flow

```
┌──────────┐
│ Borrower │
└────┬─────┘
     │ 1. create_loan_request()
     │    - amount, duration, max_interest
     ▼
┌─────────────────┐
│  Check Credit   │──► Reputation PDA
│  Requirements   │    - Verify not frozen
└────┬────────────┘    - Check tier limits
     │ 2. Validate
     ▼
┌─────────────────┐
│   Create Loan   │
│      PDA        │──► State: Requested
└────┬────────────┘    - Suggested interest rate
     │                 - Due date calculation
     ▼
┌─────────────────┐
│  Loan Visible   │
│  to Lenders     │
└─────────────────┘
```

### 2. Loan Funding Flow

```
┌─────────┐
│ Lender  │
└────┬────┘
     │ 1. Browse loans
     │    Filter by tier/rate
     ▼
┌──────────────────┐
│  Select Loan     │
│  Choose Interest │
└────┬─────────────┘
     │ 2. fund_loan(interest_rate)
     ▼
┌──────────────────┐
│  Validate Rate   │──► Check ≤ max_interest
└────┬─────────────┘
     │ 3. Transfer tokens
     ▼
┌──────────────────┐
│ Lender Tokens    │──► Escrow PDA
│  → Escrow PDA    │    (PDA controlled)
└────┬─────────────┘
     │ 4. Update state
     ▼
┌──────────────────┐
│  Loan State:     │
│  Requested →     │──► Reputation updated:
│  Funded          │    - active_loans++
└────┬─────────────┘    - total_loans++
     │                  - total_borrowed += amount
     ▼
┌──────────────────┐
│ Notify Borrower  │
│ Funds Available  │
└──────────────────┘
```

### 3. Withdrawal & Repayment Flow

```
┌──────────┐
│ Borrower │
└────┬─────┘
     │ 1. withdraw_loan()
     ▼
┌──────────────────┐
│ Escrow → Borrower│
│  Token Transfer  │──► State: Active
└────┬─────────────┘    Due date starts
     │
     │ ... Time passes ...
     │
     │ 2. repay_loan()
     ▼
┌──────────────────────┐
│  Calculate Payment   │
│  • Principal         │
│  • Interest          │──► interest = amount × rate / 10000
│  • Protocol Fee      │    fee = interest × fee_bps / 10000
└────┬─────────────────┘
     │ 3. Transfer tokens
     ├────────────────────────┐
     │                        │
     ▼                        ▼
┌─────────────┐      ┌──────────────┐
│  Lender     │      │  Protocol    │
│  (principal │      │  Treasury    │
│   + interest│      │  (fee)       │
│   - fee)    │      └──────────────┘
└──────┬──────┘
     │ 4. Check on-time status
     ▼
┌──────────────────────┐
│ Update Reputation    │
│                      │
│ On-time:             │──► Credit score +50
│  • Score +50         │    Tier recalculated
│  • on_time++         │
│                      │
│ Late:                │──► Credit score -30
│  • Score -30         │
│  • late_payments++   │
└──────────────────────┘
```

### 4. Default Detection Flow

```
┌──────────────────┐
│  Oracle Service  │
│  (Cron Job)      │
└────┬─────────────┘
     │ Every N minutes
     │ 1. Fetch all active loans
     ▼
┌──────────────────────┐
│  Check Each Loan     │
│  current_time >      │
│  due_date +          │──► If true: default detected
│  grace_period?       │
└────┬─────────────────┘
     │ 2. For each default:
     │    mark_default()
     ▼
┌──────────────────────┐
│  Update Loan State   │
│  Active → Defaulted  │
└────┬─────────────────┘
     │ 3. Penalize reputation
     ▼
┌──────────────────────┐
│  Reputation Update   │
│  • Score -150        │──► Severe penalty
│  • defaulted_loans++ │    Freeze account
│  • is_frozen = true  │
└──────────────────────┘
     │ 4. Protocol stats
     ▼
┌──────────────────────┐
│  Config Update       │
│  total_defaults++    │
└──────────────────────┘
```

## Account Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      ProtocolConfig PDA                         │
│  Seeds: ["config"]                                              │
│                                                                  │
│  • authority (admin)                                            │
│  • oracle_authority                                             │
│  • protocol_fee_bps                                             │
│  • total_loans_issued                                           │
│  • total_volume                                                 │
│  • total_defaults                                               │
│  • is_paused                                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Referenced by
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ReputationAccount PDA                      │
│  Seeds: ["reputation", owner.key()]                             │
│                                                                  │
│  • owner (borrower pubkey)         [Soulbound - Non-transferable]│
│  • credit_score (0-1000)                                        │
│  • credit_tier (A/B/C/D)                                        │
│  • total_loans, active_loans                                    │
│  • completed_loans, defaulted_loans                             │
│  • total_borrowed, total_repaid                                 │
│  • on_time_payments, late_payments                              │
│  • is_frozen                                                    │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Referenced by each loan
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LoanAccount PDA                          │
│  Seeds: ["loan", borrower.key(), loan_id.to_le_bytes()]        │
│                                                                  │
│  • borrower                                                     │
│  • lender (optional)                                            │
│  • loan_id                                                      │
│  • amount                                                       │
│  • duration_seconds                                             │
│  • max_interest_rate_bps                                        │
│  • actual_interest_rate_bps                                     │
│  • state (Requested/Funded/Active/Repaid/Defaulted/Cancelled)  │
│  • created_at, funded_at, due_date, repaid_at                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Has corresponding escrow
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EscrowAccount PDA                         │
│  Seeds: ["escrow", borrower.key(), loan_id.to_le_bytes()]      │
│                                                                  │
│  • loan_id                                                      │
│  • borrower                                                     │
│  • bump                                                         │
│                                                                  │
│  Associated Token Account:                                      │
│  • Holds lender's tokens during Funded state                    │
│  • PDA is authority (secure escrow)                             │
└─────────────────────────────────────────────────────────────────┘
```

## State Transitions

### Loan State Machine

```
                    create_loan_request()
        ┌────────────────────────────────────────┐
        │                                        │
        ▼                                        │
   ┌──────────┐                          cancel_loan_request()
   │Requested │                                  │
   └────┬─────┘                                  │
        │ fund_loan()                            │
        │                                        ▼
        ▼                              ┌───────────────┐
   ┌──────────┐                        │  Cancelled    │
   │ Funded   │                        └───────────────┘
   └────┬─────┘
        │ withdraw_loan()
        │
        ▼
   ┌──────────┐
   │  Active  │
   └────┬─────┘
        │
        ├──────────── repay_loan() ──────────┐
        │                                    │
        │                                    ▼
        │                              ┌──────────┐
        │                              │  Repaid  │
        │                              └──────────┘
        │
        └── mark_default() (oracle) ──┐
                                       │
                                       ▼
                                 ┌──────────┐
                                 │Defaulted │
                                 └──────────┘
```

### Credit Score Dynamics

```
                    Initial Score: 500
                    Initial Tier: C
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │      Borrow & Repay Cycle           │
        └─────────────────────────────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
        ▼                                    ▼
 On-Time Repayment                    Late Repayment
 Score +50                            Score -30
 ↓                                    ↓
 Eventually reach                     Score decreases
 Tier B (600+) or A (800+)           Tier may drop
                                             │
                                             │
                                             ▼
                                      Default (oracle)
                                      Score -150
                                      Account FROZEN
                                      ↓
                                      Cannot borrow
                                      until unfrozen by admin
```

## Security Model

### Access Control Matrix

| Operation | Borrower | Lender | Oracle | Admin | Anyone |
|-----------|----------|--------|--------|-------|--------|
| create_reputation | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_loan_request | ✅ | ❌ | ❌ | ❌ | ❌ |
| fund_loan | ❌ | ✅ | ❌ | ❌ | ✅ |
| withdraw_loan | ✅ | ❌ | ❌ | ❌ | ❌ |
| repay_loan | ✅ | ❌ | ❌ | ❌ | ❌ |
| cancel_loan_request | ✅ | ❌ | ❌ | ❌ | ❌ |
| mark_default | ❌ | ❌ | ✅ | ❌ | ❌ |
| initialize_config | ❌ | ❌ | ❌ | ✅ | ❌ |
| update_config | ❌ | ❌ | ❌ | ✅ | ❌ |
| unfreeze_reputation | ❌ | ❌ | ❌ | ✅ | ❌ |

### PDA Security

All critical accounts are PDAs (Program Derived Addresses):
- ✅ No private keys needed
- ✅ Deterministic addresses
- ✅ Only program can sign
- ✅ Prevents unauthorized access

### Token Security

Token transfers use escrow PDAs:
- Lender → Escrow (during funding)
- Escrow → Borrower (during withdrawal)
- Borrower → Lender (during repayment)
- Borrower → Treasury (protocol fee)

All transfers are atomic and use SPL Token program.

## Scalability Considerations

### Account Size Optimization

| Account | Size | Strategy |
|---------|------|----------|
| Config | 99 bytes | Single global account |
| Reputation | 114 bytes | One per borrower |
| Loan | 171 bytes | One per loan |
| Escrow | 49 bytes | One per active loan |

### Performance

- **Transactions/sec**: Limited by Solana (~2000 TPS)
- **Concurrent users**: Unlimited (parallel transactions)
- **Cost per operation**:
  - Create reputation: ~0.002 SOL
  - Create loan: ~0.002 SOL
  - Fund/withdraw/repay: ~0.00001 SOL each

### Future Optimizations

1. **Account Compression**: Use state compression for historical data
2. **Batch Operations**: Process multiple loans in single transaction
3. **Indexer**: Off-chain indexing for fast queries
4. **CDN**: Cache static data and IDL

---

For implementation details, see [API.md](API.md) and [lib.rs](programs/sollend_micro_protocol/src/lib.rs).
