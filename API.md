# API Reference

Complete API documentation for the Sollend Micro-Lending Protocol.

## Table of Contents
- [Instructions](#instructions)
- [Accounts](#accounts)
- [Error Codes](#error-codes)
- [Constants](#constants)

## Instructions

### Protocol Management

#### `initialize_config`
Initialize the protocol configuration.

**Parameters:**
- `oracle_authority: Pubkey` - Public key of the oracle authority
- `protocol_fee_bps: u16` - Protocol fee in basis points (100 = 1%)

**Accounts:**
- `config` (init, mut) - Protocol config PDA
- `authority` (signer, mut) - Admin authority
- `system_program` - Solana system program

**Access:** Admin only (first-time setup)

**Example:**
```typescript
await program.methods
  .initializeConfig(oracleAuthority, 150)  // 1.5% fee
  .accounts({
    config: configPda,
    authority: admin.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([admin])
  .rpc();
```

---

#### `update_config`
Update protocol configuration parameters.

**Parameters:**
- `oracle_authority: Option<Pubkey>` - New oracle authority (optional)
- `protocol_fee_bps: Option<u16>` - New protocol fee (optional, max 1000 = 10%)
- `is_paused: Option<bool>` - Pause/unpause protocol (optional)

**Accounts:**
- `config` (mut) - Protocol config PDA
- `authority` (signer) - Admin authority

**Access:** Admin only

**Errors:**
- `InvalidFee` - Fee exceeds 10%

**Example:**
```typescript
await program.methods
  .updateConfig(null, 200, null)  // Update fee to 2%
  .accounts({
    config: configPda,
    authority: admin.publicKey,
  })
  .signers([admin])
  .rpc();
```

---

### Reputation Management

#### `create_reputation`
Create a Soulbound Token (reputation NFT) for a borrower.

**Parameters:** None

**Accounts:**
- `reputation` (init, mut) - Reputation PDA for owner
- `owner` (signer, mut) - Borrower wallet
- `system_program` - Solana system program

**Access:** Anyone (once per wallet)

**Initial Values:**
- Credit Score: 500
- Credit Tier: C (tier 2)
- All counters: 0
- Is Frozen: false

**Example:**
```typescript
await program.methods
  .createReputation()
  .accounts({
    reputation: reputationPda,
    owner: borrower.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([borrower])
  .rpc();
```

---

#### `unfreeze_reputation`
Unfreeze a defaulted borrower's reputation (rehabilitation).

**Parameters:** None

**Accounts:**
- `reputation` (mut) - Reputation PDA to unfreeze
- `config` - Protocol config PDA
- `authority` (signer) - Admin authority

**Access:** Admin only

**Example:**
```typescript
await program.methods
  .unfreezeReputation()
  .accounts({
    reputation: reputationPda,
    config: configPda,
    authority: admin.publicKey,
  })
  .signers([admin])
  .rpc();
```

---

### Loan Operations

#### `create_loan_request`
Borrower creates a loan request.

**Parameters:**
- `loan_id: u64` - Unique loan identifier
- `amount: u64` - Loan amount in token units
- `duration_seconds: i64` - Loan duration (86400 to 31536000)
- `max_interest_rate_bps: u16` - Maximum interest rate borrower will accept

**Accounts:**
- `loan` (init, mut) - Loan PDA
- `borrower_reputation` - Borrower's reputation PDA
- `config` - Protocol config PDA
- `borrower` (signer, mut) - Borrower wallet
- `system_program` - Solana system program

**Access:** Anyone with reputation

**Validations:**
- Protocol not paused
- Reputation not frozen
- Amount ≤ tier max borrow limit
- Duration between 1 day and 1 year
- Max interest ≥ suggested rate

**Errors:**
- `ProtocolPaused` - Protocol is paused
- `ReputationFrozen` - Borrower is frozen
- `ExceedsMaxBorrowAmount` - Amount too high for tier
- `InvalidDuration` - Duration out of range
- `InterestRateTooLow` - Max interest below minimum

**Example:**
```typescript
await program.methods
  .createLoanRequest(
    new BN(1),                  // loan_id
    new BN(10_000_000_000),     // 10 tokens
    new BN(86400 * 30),         // 30 days
    1500                        // 15% max interest
  )
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

---

#### `fund_loan`
Lender funds a loan request.

**Parameters:**
- `interest_rate_bps: u16` - Interest rate in basis points

**Accounts:**
- `loan` (mut) - Loan PDA
- `escrow` (init, mut) - Escrow PDA
- `borrower_reputation` (mut) - Borrower's reputation PDA
- `config` - Protocol config PDA (read-only)
- `config_account` (mut) - Protocol config PDA (for stats update)
- `borrower` - Borrower's public key
- `lender` (signer, mut) - Lender wallet
- `lender_token_account` (mut) - Lender's token account
- `escrow_token_account` (mut) - Escrow token account
- `token_program` - SPL Token program
- `system_program` - Solana system program

**Access:** Anyone

**Validations:**
- Protocol not paused
- Loan in "Requested" state
- Interest rate ≤ borrower's max

**State Changes:**
- Loan state: Requested → Funded
- Tokens transferred to escrow
- Borrower stats updated
- Protocol stats updated

**Errors:**
- `ProtocolPaused` - Protocol is paused
- `InvalidLoanState` - Loan not in requested state
- `InterestRateTooHigh` - Interest exceeds max

**Example:**
```typescript
await program.methods
  .fundLoan(1000)  // 10% interest
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

---

#### `withdraw_loan`
Borrower withdraws funded loan from escrow.

**Parameters:** None

**Accounts:**
- `loan` (mut) - Loan PDA
- `escrow` (mut) - Escrow PDA
- `borrower` (signer) - Borrower wallet
- `borrower_token_account` (mut) - Borrower's token account
- `escrow_token_account` (mut) - Escrow token account
- `token_program` - SPL Token program

**Access:** Borrower only

**Validations:**
- Loan in "Funded" state

**State Changes:**
- Loan state: Funded → Active
- Tokens transferred from escrow to borrower

**Errors:**
- `InvalidLoanState` - Loan not funded

**Example:**
```typescript
await program.methods
  .withdrawLoan()
  .accounts({
    loan: loanPda,
    escrow: escrowPda,
    borrower: borrower.publicKey,
    borrowerTokenAccount,
    escrowTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([borrower])
  .rpc();
```

---

#### `repay_loan`
Borrower repays an active loan.

**Parameters:** None

**Accounts:**
- `loan` (mut) - Loan PDA
- `borrower_reputation` (mut) - Borrower's reputation PDA
- `config` - Protocol config PDA
- `borrower` (signer) - Borrower wallet
- `borrower_token_account` (mut) - Borrower's token account
- `lender_token_account` (mut) - Lender's token account
- `protocol_treasury` (mut) - Protocol treasury token account
- `token_program` - SPL Token program

**Access:** Borrower only

**Validations:**
- Loan in "Active" state

**Payment Calculation:**
```
interest = amount × interest_rate / 10000
protocol_fee = interest × protocol_fee_bps / 10000
lender_payment = amount + interest - protocol_fee
total_payment = amount + interest
```

**State Changes:**
- Loan state: Active → Repaid
- Tokens transferred to lender (principal + interest - fee)
- Protocol fee transferred to treasury
- Reputation updated:
  - On-time: +50 credit score
  - Late: -30 credit score
- Credit tier recalculated

**Errors:**
- `InvalidLoanState` - Loan not active

**Example:**
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
```

---

#### `mark_default`
Oracle marks an overdue loan as defaulted.

**Parameters:** None

**Accounts:**
- `loan` (mut) - Loan PDA
- `borrower_reputation` (mut) - Borrower's reputation PDA
- `config` (mut) - Protocol config PDA
- `oracle_authority` (signer) - Oracle authority

**Access:** Oracle only

**Validations:**
- Loan in "Active" state
- Current time > due date

**State Changes:**
- Loan state: Active → Defaulted
- Reputation: -150 credit score
- Reputation frozen (cannot borrow)
- Protocol default count incremented

**Errors:**
- `InvalidLoanState` - Loan not active
- `LoanNotDue` - Loan not past due

**Example:**
```typescript
await program.methods
  .markDefault()
  .accounts({
    loan: loanPda,
    borrowerReputation: reputationPda,
    config: configPda,
    oracleAuthority: oracle.publicKey,
  })
  .signers([oracle])
  .rpc();
```

---

#### `cancel_loan_request`
Borrower cancels an unfunded loan request.

**Parameters:** None

**Accounts:**
- `loan` (mut) - Loan PDA
- `borrower` (signer) - Borrower wallet

**Access:** Borrower only

**Validations:**
- Loan in "Requested" state

**State Changes:**
- Loan state: Requested → Cancelled

**Errors:**
- `InvalidLoanState` - Loan not in requested state

**Example:**
```typescript
await program.methods
  .cancelLoanRequest()
  .accounts({
    loan: loanPda,
    borrower: borrower.publicKey,
  })
  .signers([borrower])
  .rpc();
```

---

## Accounts

### `ProtocolConfig`
Protocol-wide configuration and statistics.

**PDA Seeds:** `["config"]`

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | Admin public key |
| `oracle_authority` | `Pubkey` | Oracle public key |
| `protocol_fee_bps` | `u16` | Protocol fee (100 = 1%) |
| `total_loans_issued` | `u64` | Total loans created |
| `total_volume` | `u64` | Total amount lent |
| `total_defaults` | `u64` | Number of defaults |
| `is_paused` | `bool` | Protocol pause status |

**Size:** 8 + 32 + 32 + 2 + 8 + 8 + 8 + 1 = 99 bytes

---

### `ReputationAccount`
Borrower's credit profile (Soulbound Token).

**PDA Seeds:** `["reputation", owner.key()]`

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `owner` | `Pubkey` | Borrower's wallet |
| `credit_score` | `u16` | Credit score (0-1000) |
| `credit_tier` | `u8` | Tier: A=0, B=1, C=2, D=3 |
| `total_loans` | `u32` | Lifetime loan count |
| `active_loans` | `u32` | Current active loans |
| `completed_loans` | `u32` | Successfully repaid loans |
| `defaulted_loans` | `u32` | Defaulted loan count |
| `total_borrowed` | `u64` | Lifetime borrowed amount |
| `total_repaid` | `u64` | Lifetime repaid amount |
| `on_time_payments` | `u32` | On-time payment count |
| `late_payments` | `u32` | Late payment count |
| `created_at` | `i64` | Creation timestamp |
| `last_updated` | `i64` | Last update timestamp |
| `is_frozen` | `bool` | Frozen status |
| `bump` | `u8` | PDA bump seed |

**Size:** 8 + 32 + 2 + 1 + 4×4 + 8×2 + 4×2 + 8×2 + 1 + 1 = 114 bytes

---

### `LoanAccount`
Individual loan details.

**PDA Seeds:** `["loan", borrower.key(), loan_id.to_le_bytes()]`

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `borrower` | `Pubkey` | Borrower's wallet |
| `loan_id` | `u64` | Unique loan ID |
| `amount` | `u64` | Loan amount |
| `funded_amount` | `u64` | Actually funded |
| `duration_seconds` | `i64` | Loan duration |
| `max_interest_rate_bps` | `u16` | Max interest borrower accepts |
| `actual_interest_rate_bps` | `u16` | Agreed interest rate |
| `suggested_interest_rate_bps` | `u16` | Calculated suggestion |
| `state` | `LoanState` | Current state |
| `created_at` | `i64` | Creation timestamp |
| `funded_at` | `i64` | Funding timestamp |
| `due_date` | `i64` | Repayment due date |
| `repaid_at` | `i64` | Repayment timestamp |
| `lender` | `Option<Pubkey>` | Lender's wallet |
| `repaid_amount` | `u64` | Amount repaid |
| `bump` | `u8` | PDA bump seed |

**Size:** 8 + 32 + 8×4 + 8 + 2×3 + 1 + 8×4 + 33 + 8 + 1 = 171 bytes

---

### `EscrowAccount`
Holds lender funds during loan lifecycle.

**PDA Seeds:** `["escrow", borrower.key(), loan_id.to_le_bytes()]`

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `loan_id` | `u64` | Associated loan ID |
| `borrower` | `Pubkey` | Borrower's wallet |
| `bump` | `u8` | PDA bump seed |

**Size:** 8 + 8 + 32 + 1 = 49 bytes

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | `ProtocolPaused` | Protocol is currently paused |
| 6001 | `ReputationFrozen` | Reputation account is frozen |
| 6002 | `ExceedsMaxBorrowAmount` | Amount exceeds maximum borrow limit for credit tier |
| 6003 | `InvalidDuration` | Invalid loan duration |
| 6004 | `InterestRateTooLow` | Interest rate too low for credit tier |
| 6005 | `InterestRateTooHigh` | Interest rate exceeds borrower's maximum |
| 6006 | `InvalidLoanState` | Invalid loan state for this operation |
| 6007 | `LoanNotDue` | Loan is not past due date |
| 6008 | `InvalidFee` | Invalid protocol fee |

---

## Constants

### Credit Tiers
```rust
CREDIT_TIER_A: u8 = 0  // Score ≥ 800
CREDIT_TIER_B: u8 = 1  // Score ≥ 600
CREDIT_TIER_C: u8 = 2  // Score ≥ 400
CREDIT_TIER_D: u8 = 3  // Score < 400
```

### Credit Scores
```rust
INITIAL_CREDIT_SCORE: u16 = 500
MAX_CREDIT_SCORE: u16 = 1000
MIN_CREDIT_SCORE: u16 = 0
TIER_A_THRESHOLD: u16 = 800
TIER_B_THRESHOLD: u16 = 600
TIER_C_THRESHOLD: u16 = 400
```

### Score Adjustments
```rust
ON_TIME_PAYMENT_BONUS: i16 = 50
LATE_PAYMENT_PENALTY: i16 = -30
DEFAULT_PENALTY: i16 = -150
```

### Interest Rates (basis points)
```rust
BASE_RATE: u16 = 500        // 5%
TIER_A_PREMIUM: u16 = 0     // +0%
TIER_B_PREMIUM: u16 = 200   // +2%
TIER_C_PREMIUM: u16 = 500   // +5%
TIER_D_PREMIUM: u16 = 1000  // +10%
```

### Max Borrow Amounts
```rust
TIER_A_MAX_BORROW: u64 = 100_000_000_000  // 100 tokens
TIER_B_MAX_BORROW: u64 = 50_000_000_000   // 50 tokens
TIER_C_MAX_BORROW: u64 = 25_000_000_000   // 25 tokens
TIER_D_MAX_BORROW: u64 = 10_000_000_000   // 10 tokens
```

---

## Helper Functions

### `calculate_credit_tier(score: u16) -> u8`
Determines credit tier from score.

```rust
if score >= 800 { TIER_A }
else if score >= 600 { TIER_B }
else if score >= 400 { TIER_C }
else { TIER_D }
```

### `calculate_interest_rate(tier: u8, duration: i64) -> u16`
Calculates suggested interest rate.

```rust
risk_premium = match tier {
    TIER_A => 0,
    TIER_B => 200,
    TIER_C => 500,
    TIER_D => 1000,
}

duration_factor = (duration / 86400 / 30) * 10  // 0.1% per month

BASE_RATE + risk_premium + duration_factor
```

### `get_max_borrow_amount(tier: u8) -> u64`
Returns max borrow limit for tier.

```rust
match tier {
    TIER_A => 100_000_000_000,
    TIER_B => 50_000_000_000,
    TIER_C => 25_000_000_000,
    TIER_D => 10_000_000_000,
}
```

### `apply_credit_adjustment(score: u16, adj: i16) -> u16`
Applies score adjustment with bounds.

```rust
new_score = (score as i32) + (adj as i32)
new_score.max(0).min(1000) as u16
```

---

## PDA Derivation

### Config PDA
```typescript
const [configPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  programId
);
```

### Reputation PDA
```typescript
const [reputationPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("reputation"), borrower.toBuffer()],
  programId
);
```

### Loan PDA
```typescript
const [loanPda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("loan"),
    borrower.toBuffer(),
    loanId.toArrayLike(Buffer, "le", 8)
  ],
  programId
);
```

### Escrow PDA
```typescript
const [escrowPda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("escrow"),
    borrower.toBuffer(),
    loanId.toArrayLike(Buffer, "le", 8)
  ],
  programId
);
```

---

For more examples, see the [tests directory](../tests/sollend_micro_protocol.ts).
