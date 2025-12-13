import { Program, web3 } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Logger } from "./logger";

interface MonitoringResults {
  activeLoansChecked: number;
  defaultsDetected: number;
  defaultsProcessed: number;
  errors: number;
}

export class LoanMonitor {
  private program: Program;
  private connection: Connection;
  private oracleKeypair: Keypair;
  private gracePeriodMinutes: number;
  private logger: Logger;

  constructor(
    program: Program,
    connection: Connection,
    oracleKeypair: Keypair,
    gracePeriodMinutes: number,
    logger: Logger
  ) {
    this.program = program;
    this.connection = connection;
    this.oracleKeypair = oracleKeypair;
    this.gracePeriodMinutes = gracePeriodMinutes;
    this.logger = logger;
  }

  async checkForDefaults(): Promise<MonitoringResults> {
    const results: MonitoringResults = {
      activeLoansChecked: 0,
      defaultsDetected: 0,
      defaultsProcessed: 0,
      errors: 0,
    };

    try {
      // Fetch all loan accounts
      const loanAccounts = await this.program.account.loanAccount.all();
      
      // Filter for active loans
      const activeLoans = loanAccounts.filter(
        (loan) => loan.account.state.active !== undefined
      );
      
      results.activeLoansChecked = activeLoans.length;
      
      this.logger.debug(`Found ${activeLoans.length} active loans to check`);

      // Check each active loan for default
      for (const loan of activeLoans) {
        try {
          const isDefaulted = await this.isLoanDefaulted(loan.account);
          
          if (isDefaulted) {
            results.defaultsDetected++;
            this.logger.warn(
              `Default detected for loan ${loan.account.loanId.toString()} ` +
              `by borrower ${loan.account.borrower.toString()}`
            );
            
            // Mark the loan as defaulted
            const success = await this.markLoanAsDefault(
              loan.account.borrower,
              loan.account.loanId
            );
            
            if (success) {
              results.defaultsProcessed++;
              this.logger.info(
                `Successfully processed default for loan ${loan.account.loanId.toString()}`
              );
            } else {
              results.errors++;
            }
          }
        } catch (error) {
          this.logger.error(`Error processing loan ${loan.account.loanId.toString()}:`, error);
          results.errors++;
        }
      }
    } catch (error) {
      this.logger.error("Error fetching loan accounts:", error);
      results.errors++;
    }

    return results;
  }

  private async isLoanDefaulted(loan: any): Promise<boolean> {
    const currentTime = Math.floor(Date.now() / 1000);
    const dueDate = loan.dueDate.toNumber();
    const gracePeriodSeconds = this.gracePeriodMinutes * 60;
    
    // Check if loan is past due date + grace period
    return currentTime > dueDate + gracePeriodSeconds;
  }

  private async markLoanAsDefault(
    borrower: PublicKey,
    loanId: any
  ): Promise<boolean> {
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        this.program.programId
      );

      const [loanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("loan"),
          borrower.toBuffer(),
          loanId.toArrayLike(Buffer, "le", 8),
        ],
        this.program.programId
      );

      const [reputationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reputation"), borrower.toBuffer()],
        this.program.programId
      );

      // Send mark_default transaction
      const tx = await this.program.methods
        .markDefault()
        .accounts({
          loan: loanPda,
          borrowerReputation: reputationPda,
          config: configPda,
          oracleAuthority: this.oracleKeypair.publicKey,
        })
        .signers([this.oracleKeypair])
        .rpc();

      this.logger.info(`Default marked. Transaction: ${tx}`);
      
      // Wait for confirmation
      await this.connection.confirmTransaction(tx, "confirmed");
      
      return true;
    } catch (error) {
      this.logger.error("Error marking loan as default:", error);
      return false;
    }
  }

  async getActiveLoanCount(): Promise<number> {
    try {
      const loanAccounts = await this.program.account.loanAccount.all();
      const activeLoans = loanAccounts.filter(
        (loan) => loan.account.state.active !== undefined
      );
      return activeLoans.length;
    } catch (error) {
      this.logger.error("Error getting active loan count:", error);
      return 0;
    }
  }

  async getOverdueLoans(): Promise<any[]> {
    try {
      const loanAccounts = await this.program.account.loanAccount.all();
      const activeLoans = loanAccounts.filter(
        (loan) => loan.account.state.active !== undefined
      );
      
      const currentTime = Math.floor(Date.now() / 1000);
      const overdueLoans = [];
      
      for (const loan of activeLoans) {
        const dueDate = loan.account.dueDate.toNumber();
        if (currentTime > dueDate) {
          overdueLoans.push({
            borrower: loan.account.borrower,
            loanId: loan.account.loanId,
            amount: loan.account.amount,
            dueDate: new Date(dueDate * 1000),
            daysOverdue: Math.floor((currentTime - dueDate) / 86400),
          });
        }
      }
      
      return overdueLoans;
    } catch (error) {
      this.logger.error("Error getting overdue loans:", error);
      return [];
    }
  }
}
