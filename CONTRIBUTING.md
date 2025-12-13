# Contributing to Sollend

Thank you for your interest in contributing to the Sollend Micro-Lending Protocol! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Areas for Contribution](#areas-for-contribution)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Rust 1.70+
- Solana CLI 1.17+
- Anchor 0.29+
- Node.js 16+
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/sollend_micro_protocol.git
cd sollend_micro_protocol

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL/sollend_micro_protocol.git
```

### Build and Test

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test
```

## 🛠️ Development Setup

### Local Development

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Watch for changes and rebuild
anchor build --watch

# Terminal 3: Run tests
anchor test --skip-local-validator
```

### Oracle Development

```bash
cd oracle

# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev
```

## 📁 Project Structure

```
sollend_micro_protocol/
├── programs/sollend_micro_protocol/
│   └── src/
│       └── lib.rs              # Main program logic
│
├── oracle/                     # Off-chain oracle service
│   ├── src/
│   │   ├── index.ts           # Service entry point
│   │   ├── loanMonitor.ts     # Loan monitoring logic
│   │   └── logger.ts          # Logging utility
│   └── package.json
│
├── scripts/                    # Utility scripts
│   ├── initialize.ts          # Protocol initialization
│   ├── stats.ts              # Statistics viewer
│   └── verify.ts             # Deployment verification
│
├── tests/                      # Test suite
│   └── sollend_micro_protocol.ts
│
└── [documentation files]       # README, API docs, etc.
```

## 📝 Coding Standards

### Rust/Anchor Program

#### Naming Conventions
- **Instructions**: `snake_case` (e.g., `create_loan_request`)
- **Accounts**: `PascalCase` (e.g., `ReputationAccount`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_CREDIT_SCORE`)

#### Code Style
```rust
// Good: Clear function with documentation
/// Creates a new loan request
/// 
/// # Arguments
/// * `amount` - Loan amount in tokens
/// * `duration_seconds` - Loan duration
pub fn create_loan_request(
    ctx: Context<CreateLoanRequest>,
    loan_id: u64,
    amount: u64,
    duration_seconds: i64,
) -> Result<()> {
    // Validation
    require!(!config.is_paused, ErrorCode::ProtocolPaused);
    
    // Logic
    let loan = &mut ctx.accounts.loan;
    loan.amount = amount;
    
    Ok(())
}
```

#### Error Handling
- Always use `Result<()>` return type
- Define custom errors in `ErrorCode` enum
- Use `require!` macro for validation
- Provide descriptive error messages

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Amount exceeds maximum borrow limit")]
    ExceedsMaxBorrowAmount,
}
```

### TypeScript/JavaScript

#### Code Style
```typescript
// Good: Clear types and documentation
/**
 * Monitors loans for defaults
 * @param loans - Array of active loans
 * @returns Number of defaults detected
 */
async function checkForDefaults(loans: Loan[]): Promise<number> {
    let defaultCount = 0;
    
    for (const loan of loans) {
        if (isDefaulted(loan)) {
            defaultCount++;
        }
    }
    
    return defaultCount;
}
```

#### Formatting
- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Max line length: 100 characters

### Documentation

#### Comments
- Document all public functions
- Explain complex logic
- Include examples where helpful

```rust
/// Calculates the interest rate based on credit tier and duration
/// 
/// # Formula
/// `rate = BASE_RATE + tier_premium + duration_factor`
/// 
/// # Example
/// ```
/// let rate = calculate_interest_rate(CREDIT_TIER_B, 86400 * 30);
/// // Returns: 700 (7%)
/// ```
fn calculate_interest_rate(tier: u8, duration: i64) -> u16 {
    // Implementation
}
```

## 🧪 Testing Guidelines

### Writing Tests

#### Test Structure
```typescript
describe("Feature Name", () => {
    // Setup
    before(async () => {
        // Initialize accounts, mint tokens, etc.
    });
    
    // Test cases
    it("should perform expected behavior", async () => {
        // Arrange
        const input = setupTestData();
        
        // Act
        const result = await performAction(input);
        
        // Assert
        assert.equal(result, expectedValue);
    });
    
    it("should reject invalid input", async () => {
        try {
            await performInvalidAction();
            assert.fail("Should have thrown error");
        } catch (error) {
            assert.include(error.message, "expected error");
        }
    });
});
```

#### Test Coverage Requirements

All pull requests should include tests for:
- ✅ Happy path (expected behavior)
- ✅ Error cases (invalid inputs)
- ✅ Edge cases (boundary conditions)
- ✅ State transitions
- ✅ Access control

#### Running Tests

```bash
# Run all tests
anchor test

# Run specific test file
anchor test tests/sollend_micro_protocol.ts

# Run with logs
ANCHOR_LOG=true anchor test

# Run specific test
anchor test -- --grep "should repay loan"
```

## 🔄 Submitting Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-loan-extensions`
- `fix/credit-score-calculation`
- `docs/update-api-reference`
- `refactor/oracle-monitoring`

### Commit Messages

Follow conventional commits:
```
type(scope): short description

Longer description if needed

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Maintenance

**Examples:**
```
feat(reputation): add credit score decay

Implements automatic credit score decay for inactive accounts.
Score decreases by 1 point per month of inactivity.

Closes #45
```

### Pull Request Process

1. **Fork and create branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and test**
   ```bash
   # Make changes
   # Run tests
   anchor test
   
   # Run linter
   yarn lint
   ```

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

5. **Create Pull Request**
   - Go to GitHub and create PR
   - Fill out PR template
   - Link related issues
   - Request review

6. **Address feedback**
   - Make requested changes
   - Push additional commits
   - Re-request review

### Pull Request Checklist

Before submitting, ensure:
- [ ] Code builds successfully (`anchor build`)
- [ ] All tests pass (`anchor test`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Commit messages are clear
- [ ] No unnecessary files included

## 🎯 Areas for Contribution

### High Priority

#### 1. **Security Audits**
- Review smart contract logic
- Test edge cases
- Identify potential vulnerabilities
- Document security considerations

#### 2. **Testing**
- Increase test coverage
- Add integration tests
- Stress testing
- Fuzzing tests

#### 3. **Documentation**
- Improve existing docs
- Add code examples
- Create tutorials
- Video walkthroughs

### Feature Development

#### 4. **Partial Loan Funding**
Allow multiple lenders per loan
- Design account structure
- Implement pro-rata interest distribution
- Add tests

#### 5. **Loan Extensions**
Allow borrowers to extend loan duration
- Calculate extension fees
- Update due dates
- Prevent abuse

#### 6. **Credit Score Decay**
Reduce scores for inactive accounts
- Track last activity
- Apply decay formula
- Notify borrowers

#### 7. **Secondary Market**
Enable loan trading
- Create loan NFTs
- Implement transfer logic
- Handle interest splits

### Infrastructure

#### 8. **Indexer Service**
Fast data queries for UI
- Index all protocol events
- Provide REST API
- Cache common queries

#### 9. **Frontend Development**
Build user interface
- Borrower dashboard
- Lender marketplace
- Analytics pages

#### 10. **Monitoring & Alerts**
Enhanced oracle capabilities
- Email/SMS notifications
- Webhook integrations
- Dashboard metrics

### Optimization

#### 11. **Gas Optimization**
Reduce transaction costs
- Optimize account sizes
- Batch operations
- Use compute budget efficiently

#### 12. **Account Compression**
Reduce storage costs
- Implement state compression
- Archive historical data
- Maintain query performance

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 13]
- Solana CLI: [e.g., 1.17.0]
- Anchor: [e.g., 0.29.0]
- Node: [e.g., 18.0.0]

**Additional Context**
Logs, screenshots, etc.
```

### Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security@sollend.com
2. Include detailed description
3. Provide proof of concept if possible
4. Allow time for fix before disclosure

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches explored

**Additional Context**
Mockups, examples, etc.
```

## 📞 Getting Help

- **Documentation**: Check [README.md](README.md) and [API.md](API.md)
- **Examples**: Review test files
- **Discord**: Join our community (TBD)
- **GitHub Issues**: Search existing issues

## 🙏 Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Sollend! 🎉**

Together we're building the future of decentralized finance.
