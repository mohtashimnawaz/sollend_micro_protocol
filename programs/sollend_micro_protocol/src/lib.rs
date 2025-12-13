use anchor_lang::prelude::*;

declare_id!("vig2EZuki3nM9feg1VWj7QkyzTkafYvAH4WmT4AX9uj");

#[program]
pub mod sollend_micro_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
