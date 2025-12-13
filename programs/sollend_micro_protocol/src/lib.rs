use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("vig2EZuki3nM9feg1VWj7QkyzTkafYvAH4WmT4AX9uj");

// Constants
pub const REPUTATION_SEED: &[u8] = b"reputation";
pub const LOAN_SEED: &[u8] = b"loan";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const CONFIG_SEED: &[u8] = b"config";

pub const CREDIT_TIER_A: u8 = 0;
pub const CREDIT_TIER_B: u8 = 1;
pub const CREDIT_TIER_C: u8 = 2;
pub const CREDIT_TIER_D: u8 = 3;

pub const INITIAL_CREDIT_SCORE: u16 = 500;
pub const MAX_CREDIT_SCORE: u16 = 1000;
pub const MIN_CREDIT_SCORE: u16 = 0;

// Credit tier thresholds
pub const TIER_A_THRESHOLD: u16 = 800;
pub const TIER_B_THRESHOLD: u16 = 600;
pub const TIER_C_THRESHOLD: u16 = 400;

// Scoring adjustments
pub const ON_TIME_PAYMENT_BONUS: i16 = 50;
pub const LATE_PAYMENT_PENALTY: i16 = -30;
pub const DEFAULT_PENALTY: i16 = -150;

// Base interest rates (in basis points, 100 = 1%)
pub const BASE_RATE: u16 = 500; // 5%
pub const TIER_A_PREMIUM: u16 = 0; // 0%
pub const TIER_B_PREMIUM: u16 = 200; // 2%
pub const TIER_C_PREMIUM: u16 = 500; // 5%
pub const TIER_D_PREMIUM: u16 = 1000; // 10%

// Max borrow amounts by tier (in lamports or token units)
pub const TIER_A_MAX_BORROW: u64 = 100_000_000_000; // 100 tokens
pub const TIER_B_MAX_BORROW: u64 = 50_000_000_000; // 50 tokens
pub const TIER_C_MAX_BORROW: u64 = 25_000_000_000; // 25 tokens
pub const TIER_D_MAX_BORROW: u64 = 10_000_000_000; // 10 tokens

#[program]
pub mod sollend_micro_protocol {
    use super::*;

    /// Initialize the protocol configuration
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        oracle_authority: Pubkey,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.oracle_authority = oracle_authority;
        config.protocol_fee_bps = protocol_fee_bps;
        config.total_loans_issued = 0;
        config.total_volume = 0;
        config.total_defaults = 0;
        config.is_paused = false;
        
        msg!("Protocol config initialized");
        Ok(())
    }

    /// Update protocol configuration (admin only)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        oracle_authority: Option<Pubkey>,
        protocol_fee_bps: Option<u16>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        
        if let Some(oracle) = oracle_authority {
            config.oracle_authority = oracle;
        }
        if let Some(fee) = protocol_fee_bps {
            require!(fee <= 1000, ErrorCode::InvalidFee); // Max 10%
            config.protocol_fee_bps = fee;
        }
        if let Some(paused) = is_paused {
            config.is_paused = paused;
        }
        
        msg!("Protocol config updated");
        Ok(())
    }

    /// Create a Reputation NFT (Soulbound Token) for a new borrower
    pub fn create_reputation(ctx: Context<CreateReputation>) -> Result<()> {
        let reputation = &mut ctx.accounts.reputation;
        let clock = Clock::get()?;
        
        reputation.owner = ctx.accounts.owner.key();
        reputation.credit_score = INITIAL_CREDIT_SCORE;
        reputation.credit_tier = calculate_credit_tier(INITIAL_CREDIT_SCORE);
        reputation.total_loans = 0;
        reputation.active_loans = 0;
        reputation.completed_loans = 0;
        reputation.defaulted_loans = 0;
        reputation.total_borrowed = 0;
        reputation.total_repaid = 0;
        reputation.on_time_payments = 0;
        reputation.late_payments = 0;
        reputation.created_at = clock.unix_timestamp;
        reputation.last_updated = clock.unix_timestamp;
        reputation.is_frozen = false;
        reputation.bump = ctx.bumps.reputation;
        
        msg!("Reputation NFT created for: {}", ctx.accounts.owner.key());
        msg!("Initial credit score: {}", INITIAL_CREDIT_SCORE);
        Ok(())
    }

    /// Create a loan request
    pub fn create_loan_request(
        ctx: Context<CreateLoanRequest>,
        loan_id: u64,
        amount: u64,
        duration_seconds: i64,
        max_interest_rate_bps: u16,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let reputation = &ctx.accounts.borrower_reputation;
        let loan = &mut ctx.accounts.loan;
        let clock = Clock::get()?;
        
        // Check protocol is not paused
        require!(!config.is_paused, ErrorCode::ProtocolPaused);
        
        // Check reputation is not frozen
        require!(!reputation.is_frozen, ErrorCode::ReputationFrozen);
        
        // Check borrowing limit based on credit tier
        let max_borrow = get_max_borrow_amount(reputation.credit_tier);
        require!(amount <= max_borrow, ErrorCode::ExceedsMaxBorrowAmount);
        
        // Check reasonable duration (1 day to 1 year)
        require!(
            duration_seconds >= 86400 && duration_seconds <= 31536000,
            ErrorCode::InvalidDuration
        );
        
        // Calculate minimum interest rate based on credit tier
        let min_interest = calculate_interest_rate(
            reputation.credit_tier,
            duration_seconds
        );
        
        // Ensure max interest is reasonable
        require!(
            max_interest_rate_bps >= min_interest,
            ErrorCode::InterestRateTooLow
        );
        
        loan.borrower = ctx.accounts.borrower.key();
        loan.loan_id = loan_id;
        loan.amount = amount;
        loan.funded_amount = 0;
        loan.duration_seconds = duration_seconds;
        loan.max_interest_rate_bps = max_interest_rate_bps;
        loan.actual_interest_rate_bps = 0;
        loan.suggested_interest_rate_bps = min_interest;
        loan.state = LoanState::Requested;
        loan.created_at = clock.unix_timestamp;
        loan.funded_at = 0;
        loan.due_date = 0;
        loan.repaid_at = 0;
        loan.lender = None;
        loan.repaid_amount = 0;
        loan.bump = ctx.bumps.loan;
        
        msg!("Loan request created: {} tokens", amount);
        msg!("Suggested interest rate: {} bps", min_interest);
        Ok(())
    }

    /// Fund a loan (lender action)
    pub fn fund_loan(
        ctx: Context<FundLoan>,
        interest_rate_bps: u16,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let loan = &mut ctx.accounts.loan;
        let reputation = &mut ctx.accounts.borrower_reputation;
        let clock = Clock::get()?;
        
        // Check protocol is not paused
        require!(!config.is_paused, ErrorCode::ProtocolPaused);
        
        // Check loan is in requested state
        require!(loan.state == LoanState::Requested, ErrorCode::InvalidLoanState);
        
        // Check interest rate is within borrower's max
        require!(
            interest_rate_bps <= loan.max_interest_rate_bps,
            ErrorCode::InterestRateTooHigh
        );
        
        // Transfer tokens from lender to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, loan.amount)?;
        
        // Update loan state
        loan.lender = Some(ctx.accounts.lender.key());
        loan.actual_interest_rate_bps = interest_rate_bps;
        loan.funded_amount = loan.amount;
        loan.state = LoanState::Funded;
        loan.funded_at = clock.unix_timestamp;
        loan.due_date = clock.unix_timestamp + loan.duration_seconds;
        
        // Update reputation stats
        reputation.active_loans += 1;
        reputation.total_loans += 1;
        reputation.total_borrowed += loan.amount;
        reputation.last_updated = clock.unix_timestamp;
        
        // Update config stats
        let config_mut = &mut ctx.accounts.config_account;
        config_mut.total_loans_issued += 1;
        config_mut.total_volume += loan.amount;
        
        msg!("Loan funded by: {}", ctx.accounts.lender.key());
        msg!("Interest rate: {} bps", interest_rate_bps);
        Ok(())
    }

    /// Withdraw loan funds (borrower action)
    pub fn withdraw_loan(ctx: Context<WithdrawLoan>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        
        // Check loan is funded
        require!(loan.state == LoanState::Funded, ErrorCode::InvalidLoanState);
        
        // Transfer tokens from escrow to borrower
        let borrower_key = ctx.accounts.borrower.key();
        let loan_id = loan.loan_id.to_le_bytes();
        let seeds = &[
            ESCROW_SEED,
            borrower_key.as_ref(),
            loan_id.as_ref(),
            &[ctx.accounts.escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.borrower_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, loan.amount)?;
        
        // Update loan state
        loan.state = LoanState::Active;
        
        msg!("Loan funds withdrawn: {} tokens", loan.amount);
        Ok(())
    }

    /// Repay a loan (borrower action)
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> {
        let config = &ctx.accounts.config;
        let loan = &mut ctx.accounts.loan;
        let reputation = &mut ctx.accounts.borrower_reputation;
        let clock = Clock::get()?;
        
        // Check loan is active
        require!(loan.state == LoanState::Active, ErrorCode::InvalidLoanState);
        
        // Calculate total repayment (principal + interest - protocol fee)
        let interest_amount = (loan.amount as u128)
            .checked_mul(loan.actual_interest_rate_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        
        let protocol_fee = (interest_amount as u128)
            .checked_mul(config.protocol_fee_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        
        let lender_amount = loan.amount + interest_amount - protocol_fee;
        let total_repayment = loan.amount + interest_amount;
        
        // Transfer principal + interest from borrower to lender
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_token_account.to_account_info(),
            to: ctx.accounts.lender_token_account.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, lender_amount)?;
        
        // Transfer protocol fee to protocol treasury
        if protocol_fee > 0 {
            let cpi_accounts_fee = Transfer {
                from: ctx.accounts.borrower_token_account.to_account_info(),
                to: ctx.accounts.protocol_treasury.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            };
            let cpi_ctx_fee = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts_fee);
            token::transfer(cpi_ctx_fee, protocol_fee)?;
        }
        
        // Update loan state
        loan.state = LoanState::Repaid;
        loan.repaid_at = clock.unix_timestamp;
        loan.repaid_amount = total_repayment;
        
        // Determine if payment is on time or late
        let is_late = clock.unix_timestamp > loan.due_date;
        
        // Update reputation
        reputation.active_loans = reputation.active_loans.saturating_sub(1);
        reputation.completed_loans += 1;
        reputation.total_repaid += total_repayment;
        
        if is_late {
            reputation.late_payments += 1;
            reputation.credit_score = apply_credit_adjustment(
                reputation.credit_score,
                LATE_PAYMENT_PENALTY
            );
            msg!("Late payment - credit score decreased");
        } else {
            reputation.on_time_payments += 1;
            reputation.credit_score = apply_credit_adjustment(
                reputation.credit_score,
                ON_TIME_PAYMENT_BONUS
            );
            msg!("On-time payment - credit score increased");
        }
        
        // Update credit tier based on new score
        reputation.credit_tier = calculate_credit_tier(reputation.credit_score);
        reputation.last_updated = clock.unix_timestamp;
        
        msg!("Loan repaid: {} tokens (principal) + {} tokens (interest)", loan.amount, interest_amount);
        msg!("New credit score: {}, tier: {}", reputation.credit_score, reputation.credit_tier);
        Ok(())
    }

    /// Mark a loan as defaulted (oracle only)
    pub fn mark_default(ctx: Context<MarkDefault>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        let reputation = &mut ctx.accounts.borrower_reputation;
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;
        
        // Check loan is active
        require!(loan.state == LoanState::Active, ErrorCode::InvalidLoanState);
        
        // Check loan is past due date
        require!(clock.unix_timestamp > loan.due_date, ErrorCode::LoanNotDue);
        
        // Update loan state
        loan.state = LoanState::Defaulted;
        
        // Apply heavy penalty to reputation
        reputation.active_loans = reputation.active_loans.saturating_sub(1);
        reputation.defaulted_loans += 1;
        reputation.credit_score = apply_credit_adjustment(
            reputation.credit_score,
            DEFAULT_PENALTY
        );
        reputation.credit_tier = calculate_credit_tier(reputation.credit_score);
        reputation.is_frozen = true; // Freeze reputation for defaulters
        reputation.last_updated = clock.unix_timestamp;
        
        // Update config stats
        config.total_defaults += 1;
        
        msg!("Loan marked as defaulted");
        msg!("Borrower reputation frozen - credit score: {}", reputation.credit_score);
        Ok(())
    }

    /// Unfreeze reputation (admin only, for rehabilitation)
    pub fn unfreeze_reputation(ctx: Context<UnfreezeReputation>) -> Result<()> {
        let reputation = &mut ctx.accounts.reputation;
        let clock = Clock::get()?;
        
        reputation.is_frozen = false;
        reputation.last_updated = clock.unix_timestamp;
        
        msg!("Reputation unfrozen for: {}", reputation.owner);
        Ok(())
    }

    /// Cancel a loan request (borrower only, before funding)
    pub fn cancel_loan_request(ctx: Context<CancelLoanRequest>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        
        // Check loan is in requested state
        require!(loan.state == LoanState::Requested, ErrorCode::InvalidLoanState);
        
        // Update loan state
        loan.state = LoanState::Cancelled;
        
        msg!("Loan request cancelled");
        Ok(())
    }
}

// Helper functions
fn calculate_credit_tier(credit_score: u16) -> u8 {
    if credit_score >= TIER_A_THRESHOLD {
        CREDIT_TIER_A
    } else if credit_score >= TIER_B_THRESHOLD {
        CREDIT_TIER_B
    } else if credit_score >= TIER_C_THRESHOLD {
        CREDIT_TIER_C
    } else {
        CREDIT_TIER_D
    }
}

fn calculate_interest_rate(credit_tier: u8, duration_seconds: i64) -> u16 {
    let risk_premium = match credit_tier {
        CREDIT_TIER_A => TIER_A_PREMIUM,
        CREDIT_TIER_B => TIER_B_PREMIUM,
        CREDIT_TIER_C => TIER_C_PREMIUM,
        _ => TIER_D_PREMIUM,
    };
    
    // Duration factor: longer loans = slightly higher rate
    // Add 0.1% per month (30 days)
    let duration_days = duration_seconds / 86400;
    let duration_factor = (duration_days / 30) as u16 * 10; // 10 bps per month
    
    BASE_RATE + risk_premium + duration_factor
}

fn get_max_borrow_amount(credit_tier: u8) -> u64 {
    match credit_tier {
        CREDIT_TIER_A => TIER_A_MAX_BORROW,
        CREDIT_TIER_B => TIER_B_MAX_BORROW,
        CREDIT_TIER_C => TIER_C_MAX_BORROW,
        _ => TIER_D_MAX_BORROW,
    }
}

fn apply_credit_adjustment(current_score: u16, adjustment: i16) -> u16 {
    let new_score = (current_score as i32) + (adjustment as i32);
    new_score.max(MIN_CREDIT_SCORE as i32).min(MAX_CREDIT_SCORE as i32) as u16
}

// Account Contexts
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolConfig::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateReputation<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + ReputationAccount::INIT_SPACE,
        seeds = [REPUTATION_SEED, owner.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(loan_id: u64)]
pub struct CreateLoanRequest<'info> {
    #[account(
        init,
        payer = borrower,
        space = 8 + LoanAccount::INIT_SPACE,
        seeds = [LOAN_SEED, borrower.key().as_ref(), loan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub loan: Account<'info, LoanAccount>,
    #[account(
        seeds = [REPUTATION_SEED, borrower.key().as_ref()],
        bump = borrower_reputation.bump
    )]
    pub borrower_reputation: Account<'info, ReputationAccount>,
    #[account(
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub borrower: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundLoan<'info> {
    #[account(
        mut,
        seeds = [LOAN_SEED, loan.borrower.as_ref(), loan.loan_id.to_le_bytes().as_ref()],
        bump = loan.bump,
        has_one = borrower
    )]
    pub loan: Account<'info, LoanAccount>,
    #[account(
        init,
        payer = lender,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [ESCROW_SEED, loan.borrower.as_ref(), loan.loan_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(
        mut,
        seeds = [REPUTATION_SEED, borrower.key().as_ref()],
        bump = borrower_reputation.bump
    )]
    pub borrower_reputation: Account<'info, ReputationAccount>,
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub config_account: Account<'info, ProtocolConfig>,
    /// CHECK: This is the borrower's public key
    pub borrower: AccountInfo<'info>,
    #[account(mut)]
    pub lender: Signer<'info>,
    #[account(mut)]
    pub lender_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawLoan<'info> {
    #[account(
        mut,
        seeds = [LOAN_SEED, borrower.key().as_ref(), loan.loan_id.to_le_bytes().as_ref()],
        bump = loan.bump,
        has_one = borrower
    )]
    pub loan: Account<'info, LoanAccount>,
    #[account(
        mut,
        seeds = [ESCROW_SEED, borrower.key().as_ref(), loan.loan_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(
        mut,
        seeds = [LOAN_SEED, borrower.key().as_ref(), loan.loan_id.to_le_bytes().as_ref()],
        bump = loan.bump,
        has_one = borrower
    )]
    pub loan: Account<'info, LoanAccount>,
    #[account(
        mut,
        seeds = [REPUTATION_SEED, borrower.key().as_ref()],
        bump = borrower_reputation.bump
    )]
    pub borrower_reputation: Account<'info, ReputationAccount>,
    #[account(
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub lender_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub protocol_treasury: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MarkDefault<'info> {
    #[account(
        mut,
        seeds = [LOAN_SEED, loan.borrower.as_ref(), loan.loan_id.to_le_bytes().as_ref()],
        bump = loan.bump
    )]
    pub loan: Account<'info, LoanAccount>,
    #[account(
        mut,
        seeds = [REPUTATION_SEED, loan.borrower.as_ref()],
        bump = borrower_reputation.bump
    )]
    pub borrower_reputation: Account<'info, ReputationAccount>,
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump,
        has_one = oracle_authority
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub oracle_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UnfreezeReputation<'info> {
    #[account(
        mut,
        seeds = [REPUTATION_SEED, reputation.owner.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, ReputationAccount>,
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        has_one = authority
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelLoanRequest<'info> {
    #[account(
        mut,
        seeds = [LOAN_SEED, borrower.key().as_ref(), loan.loan_id.to_le_bytes().as_ref()],
        bump = loan.bump,
        has_one = borrower
    )]
    pub loan: Account<'info, LoanAccount>,
    pub borrower: Signer<'info>,
}

// Account Structures
#[account]
#[derive(InitSpace)]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub oracle_authority: Pubkey,
    pub protocol_fee_bps: u16, // Fee in basis points (100 = 1%)
    pub total_loans_issued: u64,
    pub total_volume: u64,
    pub total_defaults: u64,
    pub is_paused: bool,
}

#[account]
#[derive(InitSpace)]
pub struct ReputationAccount {
    pub owner: Pubkey,
    pub credit_score: u16, // 0-1000
    pub credit_tier: u8, // A=0, B=1, C=2, D=3
    pub total_loans: u32,
    pub active_loans: u32,
    pub completed_loans: u32,
    pub defaulted_loans: u32,
    pub total_borrowed: u64,
    pub total_repaid: u64,
    pub on_time_payments: u32,
    pub late_payments: u32,
    pub created_at: i64,
    pub last_updated: i64,
    pub is_frozen: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LoanAccount {
    pub borrower: Pubkey,
    pub loan_id: u64,
    pub amount: u64,
    pub funded_amount: u64,
    pub duration_seconds: i64,
    pub max_interest_rate_bps: u16,
    pub actual_interest_rate_bps: u16,
    pub suggested_interest_rate_bps: u16,
    pub state: LoanState,
    pub created_at: i64,
    pub funded_at: i64,
    pub due_date: i64,
    pub repaid_at: i64,
    #[max_len(1)]
    pub lender: Option<Pubkey>,
    pub repaid_amount: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    pub loan_id: u64,
    pub borrower: Pubkey,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum LoanState {
    Requested,
    Funded,
    Active,
    Repaid,
    Defaulted,
    Cancelled,
}

// Error Codes
#[error_code]
pub enum ErrorCode {
    #[msg("Protocol is currently paused")]
    ProtocolPaused,
    #[msg("Reputation account is frozen")]
    ReputationFrozen,
    #[msg("Amount exceeds maximum borrow limit for credit tier")]
    ExceedsMaxBorrowAmount,
    #[msg("Invalid loan duration")]
    InvalidDuration,
    #[msg("Interest rate too low for credit tier")]
    InterestRateTooLow,
    #[msg("Interest rate exceeds borrower's maximum")]
    InterestRateTooHigh,
    #[msg("Invalid loan state for this operation")]
    InvalidLoanState,
    #[msg("Loan is not past due date")]
    LoanNotDue,
    #[msg("Invalid protocol fee")]
    InvalidFee,
}
