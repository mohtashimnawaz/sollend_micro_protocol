import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { SollendMicroProtocol } from "../target/types/sollend_micro_protocol";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("Sollend Micro-Lending Protocol", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SollendMicroProtocol as Program<SollendMicroProtocol>;
  
  // Test accounts
  let mint: PublicKey;
  let authority: Keypair;
  let oracle: Keypair;
  let borrower: Keypair;
  let lender: Keypair;
  let protocolTreasury: PublicKey;
  
  // Token accounts
  let borrowerTokenAccount: PublicKey;
  let lenderTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  
  // PDAs
  let configPda: PublicKey;
  let reputationPda: PublicKey;
  let loanPda: PublicKey;
  let escrowPda: PublicKey;
  
  const loanId = new BN(1);
  const loanAmount = new BN(10_000_000_000); // 10 tokens
  const durationSeconds = new BN(86400 * 30); // 30 days
  const maxInterestRate = 1500; // 15%
  
  before(async () => {
    // Generate keypairs
    authority = Keypair.generate();
    oracle = Keypair.generate();
    borrower = Keypair.generate();
    lender = Keypair.generate();
    
    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(oracle.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(borrower.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(lender.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
    ]);
    
    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create test token mint
    mint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9 // 9 decimals
    );
    
    // Create token accounts
    borrowerTokenAccount = await createAccount(
      provider.connection,
      borrower,
      mint,
      borrower.publicKey
    );
    
    lenderTokenAccount = await createAccount(
      provider.connection,
      lender,
      mint,
      lender.publicKey
    );
    
    treasuryTokenAccount = await createAccount(
      provider.connection,
      authority,
      mint,
      authority.publicKey
    );
    
    protocolTreasury = treasuryTokenAccount;
    
    // Mint tokens to lender
    await mintTo(
      provider.connection,
      authority,
      mint,
      lenderTokenAccount,
      authority,
      100_000_000_000 // 100 tokens
    );
    
    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    
    [reputationPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("reputation"), borrower.publicKey.toBuffer()],
      program.programId
    );
    
    [loanPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("loan"),
        borrower.publicKey.toBuffer(),
        loanId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    
    [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        borrower.publicKey.toBuffer(),
        loanId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    
    // Get the associated token account for the escrow PDA
    escrowTokenAccount = await getAssociatedTokenAddress(
      mint,
      escrowPda,
      true // allowOwnerOffCurve - this allows PDA to be the owner
    );
  });

  describe("Protocol Initialization", () => {
    it("Initializes protocol config", async () => {
      const tx = await program.methods
        .initializeConfig(oracle.publicKey, 100) // 1% protocol fee
        .accounts({
          config: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("Config initialized:", tx);

      // Verify config
      const config = await program.account.protocolConfig.fetch(configPda);
      assert.ok(config.authority.equals(authority.publicKey));
      assert.ok(config.oracleAuthority.equals(oracle.publicKey));
      assert.equal(config.protocolFeeBps, 100);
      assert.equal(config.totalLoansIssued.toNumber(), 0);
      assert.equal(config.isPaused, false);
    });

    it("Updates protocol config", async () => {
      const tx = await program.methods
        .updateConfig(null, 150, null) // Update fee to 1.5%
        .accounts({
          config: configPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log("Config updated:", tx);

      const config = await program.account.protocolConfig.fetch(configPda);
      assert.equal(config.protocolFeeBps, 150);
    });
  });

  describe("Reputation System", () => {
    it("Creates reputation NFT for borrower", async () => {
      const tx = await program.methods
        .createReputation()
        .accounts({
          reputation: reputationPda,
          owner: borrower.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([borrower])
        .rpc();

      console.log("Reputation created:", tx);

      // Verify reputation
      const reputation = await program.account.reputationAccount.fetch(reputationPda);
      assert.ok(reputation.owner.equals(borrower.publicKey));
      assert.equal(reputation.creditScore, 500); // Initial score
      assert.equal(reputation.creditTier, 2); // Tier C
      assert.equal(reputation.totalLoans, 0);
      assert.equal(reputation.isFrozen, false);
    });

    it("Prevents duplicate reputation creation", async () => {
      try {
        await program.methods
          .createReputation()
          .accounts({
            reputation: reputationPda,
            owner: borrower.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([borrower])
          .rpc();
        
        assert.fail("Should have thrown error");
      } catch (error) {
        assert.include(error.message, "already in use");
      }
    });
  });

  describe("Loan Lifecycle", () => {
    it("Creates a loan request", async () => {
      const tx = await program.methods
        .createLoanRequest(loanId, loanAmount, durationSeconds, maxInterestRate)
        .accounts({
          loan: loanPda,
          borrowerReputation: reputationPda,
          config: configPda,
          borrower: borrower.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([borrower])
        .rpc();

      console.log("Loan request created:", tx);

      // Verify loan
      const loan = await program.account.loanAccount.fetch(loanPda);
      assert.ok(loan.borrower.equals(borrower.publicKey));
      assert.equal(loan.loanId.toNumber(), loanId.toNumber());
      assert.equal(loan.amount.toNumber(), loanAmount.toNumber());
      assert.ok(loan.state.requested !== undefined);
    });

    it("Funds the loan", async () => {
      const interestRate = 1000; // 10%
      
      // Create the escrow token account before funding
      const {
        createAssociatedTokenAccountInstruction,
        getAssociatedTokenAddressSync
      } = await import("@solana/spl-token");
      
      const escrowAta = getAssociatedTokenAddressSync(
        mint,
        escrowPda,
        true // allowOwnerOffCurve
      );
      
      // Create the ATA if it doesn't exist
      try {
        await getAccount(provider.connection, escrowAta);
      } catch {
        const ix = createAssociatedTokenAccountInstruction(
          lender.publicKey,
          escrowAta,
          escrowPda,
          mint
        );
        const tx = new anchor.web3.Transaction().add(ix);
        await provider.sendAndConfirm(tx, [lender]);
      }
      
      escrowTokenAccount = escrowAta;
      
      const tx = await program.methods
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

      console.log("Loan funded:", tx);

      // Verify loan state
      const loan = await program.account.loanAccount.fetch(loanPda);
      assert.ok(loan.state.funded !== undefined);
      assert.ok(loan.lender.equals(lender.publicKey));
      assert.equal(loan.actualInterestRateBps, interestRate);

      // Verify reputation updated
      const reputation = await program.account.reputationAccount.fetch(reputationPda);
      assert.equal(reputation.activeLoans, 1);
      assert.equal(reputation.totalLoans, 1);
    });

    it("Withdraws loan funds", async () => {
      const tx = await program.methods
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

      console.log("Loan withdrawn:", tx);

      // Verify loan state
      const loan = await program.account.loanAccount.fetch(loanPda);
      assert.ok(loan.state.active !== undefined);

      // Verify tokens transferred
      const borrowerAccount = await getAccount(provider.connection, borrowerTokenAccount);
      assert.equal(borrowerAccount.amount.toString(), loanAmount.toString());
    });

    it("Repays the loan on time", async () => {
      // Mint repayment tokens to borrower (principal + interest)
      const interestAmount = loanAmount.mul(new BN(1000)).div(new BN(10000)); // 10%
      const totalRepayment = loanAmount.add(interestAmount);
      
      await mintTo(
        provider.connection,
        authority,
        mint,
        borrowerTokenAccount,
        authority,
        totalRepayment.toNumber()
      );

      const tx = await program.methods
        .repayLoan()
        .accounts({
          loan: loanPda,
          borrowerReputation: reputationPda,
          config: configPda,
          borrower: borrower.publicKey,
          borrowerTokenAccount,
          lenderTokenAccount,
          protocolTreasury: treasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([borrower])
        .rpc();

      console.log("Loan repaid:", tx);

      // Verify loan state
      const loan = await program.account.loanAccount.fetch(loanPda);
      assert.ok(loan.state.repaid !== undefined);

      // Verify reputation improved
      const reputation = await program.account.reputationAccount.fetch(reputationPda);
      assert.equal(reputation.activeLoans, 0);
      assert.equal(reputation.completedLoans, 1);
      assert.equal(reputation.onTimePayments, 1);
      assert.ok(reputation.creditScore > 500); // Score increased
    });
  });

  describe("Default Handling", () => {
    let defaultLoanId: BN;
    let defaultLoanPda: PublicKey;
    let defaultEscrowPda: PublicKey;
    let defaultEscrowTokenAccount: PublicKey;

    before(async () => {
      defaultLoanId = new BN(2);
      
      [defaultLoanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("loan"),
          borrower.publicKey.toBuffer(),
          defaultLoanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      
      [defaultEscrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          borrower.publicKey.toBuffer(),
          defaultLoanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      
      defaultEscrowTokenAccount = await getAssociatedTokenAddress(
        mint,
        defaultEscrowPda,
        true // allowOwnerOffCurve
      );
    });

    it("Creates and funds a loan that will default", async () => {
      // Create loan request with short duration for testing (5 seconds)
      await program.methods
        .createLoanRequest(
          defaultLoanId,
          new BN(5_000_000_000), // 5 tokens
          new BN(5), // 5 seconds duration for testing
          1000
        )
        .accounts({
          loan: defaultLoanPda,
          borrowerReputation: reputationPda,
          config: configPda,
          borrower: borrower.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([borrower])
        .rpc();

      // Create the escrow token account before funding
      const escrowAta = getAssociatedTokenAddressSync(
        mint,
        defaultEscrowPda,
        true // allowOwnerOffCurve
      );
      
      // Create the ATA if it doesn't exist
      try {
        await getAccount(provider.connection, escrowAta);
      } catch {
        const ix = createAssociatedTokenAccountInstruction(
          lender.publicKey,
          escrowAta,
          defaultEscrowPda,
          mint
        );
        const tx = new anchor.web3.Transaction().add(ix);
        await provider.sendAndConfirm(tx, [lender]);
      }
      
      defaultEscrowTokenAccount = escrowAta;

      // Fund the loan
      await program.methods
        .fundLoan(800)
        .accounts({
          loan: defaultLoanPda,
          escrow: defaultEscrowPda,
          borrowerReputation: reputationPda,
          config: configPda,
          configAccount: configPda,
          borrower: borrower.publicKey,
          lender: lender.publicKey,
          lenderTokenAccount,
          escrowTokenAccount: defaultEscrowTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([lender])
        .rpc();

      // Withdraw funds
      await program.methods
        .withdrawLoan()
        .accounts({
          loan: defaultLoanPda,
          escrow: defaultEscrowPda,
          borrower: borrower.publicKey,
          borrowerTokenAccount,
          escrowTokenAccount: defaultEscrowTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([borrower])
        .rpc();

      console.log("Default loan created and activated");
    });

    it("Marks loan as defaulted (oracle)", async () => {
      // Wait for loan to be past due (6 seconds > 5 second duration)
      await new Promise(resolve => setTimeout(resolve, 6000));

      const tx = await program.methods
        .markDefault()
        .accounts({
          loan: defaultLoanPda,
          borrowerReputation: reputationPda,
          config: configPda,
          oracleAuthority: oracle.publicKey,
        })
        .signers([oracle])
        .rpc();

      console.log("Loan marked as default:", tx);

      // Verify loan state
      const loan = await program.account.loanAccount.fetch(defaultLoanPda);
      assert.ok(loan.state.defaulted !== undefined);

      // Verify reputation penalized
      const reputation = await program.account.reputationAccount.fetch(reputationPda);
      assert.equal(reputation.defaultedLoans, 1);
      assert.ok(reputation.isFrozen); // Frozen after default
      assert.ok(reputation.creditScore < 550); // Score decreased significantly
    });

    it("Prevents frozen borrower from creating new loans", async () => {
      const newLoanId = new BN(3);
      const [newLoanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("loan"),
          borrower.publicKey.toBuffer(),
          newLoanId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createLoanRequest(newLoanId, loanAmount, durationSeconds, maxInterestRate)
          .accounts({
            loan: newLoanPda,
            borrowerReputation: reputationPda,
            config: configPda,
            borrower: borrower.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([borrower])
          .rpc();
        
        assert.fail("Should have thrown error");
      } catch (error) {
        // Check for frozen reputation error
        assert.ok(error.toString().includes("ReputationFrozen") || error.toString().includes("6001"));
      }
    });

    it("Admin unfreezes reputation", async () => {
      const tx = await program.methods
        .unfreezeReputation()
        .accounts({
          reputation: reputationPda,
          config: configPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log("Reputation unfrozen:", tx);

      const reputation = await program.account.reputationAccount.fetch(reputationPda);
      assert.equal(reputation.isFrozen, false);
    });
  });

  describe("Interest Rate Calculations", () => {
    it("Calculates correct interest rates based on credit tier", async () => {
      const reputation = await program.account.reputationAccount.fetch(reputationPda);
      const loan = await program.account.loanAccount.fetch(loanPda);
      
      console.log("Credit Score:", reputation.creditScore);
      console.log("Credit Tier:", reputation.creditTier);
      console.log("Suggested Interest Rate:", loan.suggestedInterestRateBps, "bps");
      
      // Tier C (score < 600) should have higher rates
      assert.ok(loan.suggestedInterestRateBps > 700); // Base + premium
    });
  });

  describe("Protocol Statistics", () => {
    it("Tracks protocol-wide statistics", async () => {
      const config = await program.account.protocolConfig.fetch(configPda);
      
      console.log("Total Loans Issued:", config.totalLoansIssued.toNumber());
      console.log("Total Volume:", config.totalVolume.toNumber());
      console.log("Total Defaults:", config.totalDefaults.toNumber());
      
      assert.ok(config.totalLoansIssued.toNumber() >= 2);
      assert.ok(config.totalVolume.toNumber() > 0);
      // Should have 1 default from the default handling test
      assert.equal(config.totalDefaults.toNumber(), 1);
    });
  });
});
