import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { SollendMicroProtocol } from "../target/types/sollend_micro_protocol";
import fs from "fs";

async function getStats() {
  const network = process.env.SOLANA_NETWORK || "devnet";
  
  let rpcUrl: string;
  switch (network) {
    case "mainnet":
      rpcUrl = "https://api.mainnet-beta.solana.com";
      break;
    case "devnet":
      rpcUrl = "https://api.devnet.solana.com";
      break;
    case "localnet":
      rpcUrl = "http://localhost:8899";
      break;
    default:
      rpcUrl = "https://api.devnet.solana.com";
  }
  
  const connection = new web3.Connection(rpcUrl, "confirmed");
  const wallet = new anchor.Wallet(web3.Keypair.generate()); // Dummy wallet for read-only
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idl = JSON.parse(
    fs.readFileSync("./target/idl/sollend_micro_protocol.json", "utf-8")
  );
  const programId = new web3.PublicKey(idl.metadata.address);
  const program = new Program(idl, programId, provider) as Program<SollendMicroProtocol>;

  const [configPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("═══════════════════════════════════════");
  console.log("  Sollend Protocol Statistics");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network);
  console.log("Program ID:", programId.toString());
  console.log("═══════════════════════════════════════\n");

  try {
    const config = await program.account.protocolConfig.fetch(configPda);
    
    console.log("📊 Protocol Overview");
    console.log("───────────────────────────────────────");
    console.log("Status:", config.isPaused ? "⏸️  PAUSED" : "✅ ACTIVE");
    console.log("Authority:", config.authority.toString());
    console.log("Oracle:", config.oracleAuthority.toString());
    console.log("Protocol Fee:", config.protocolFeeBps, "bps (", config.protocolFeeBps / 100, "%)");
    console.log();
    
    console.log("💰 Loan Statistics");
    console.log("───────────────────────────────────────");
    console.log("Total Loans Issued:", config.totalLoansIssued.toString());
    console.log("Total Volume:", config.totalVolume.toString(), "tokens");
    console.log("Total Defaults:", config.totalDefaults.toString());
    
    if (config.totalLoansIssued.toNumber() > 0) {
      const defaultRate = (config.totalDefaults.toNumber() / config.totalLoansIssued.toNumber() * 100).toFixed(2);
      console.log("Default Rate:", defaultRate + "%");
    }
    console.log();
    
    // Get all reputation accounts
    console.log("👥 Borrower Statistics");
    console.log("───────────────────────────────────────");
    const reputationAccounts = await program.account.reputationAccount.all();
    console.log("Total Borrowers:", reputationAccounts.length);
    
    if (reputationAccounts.length > 0) {
      let tierCounts = { A: 0, B: 0, C: 0, D: 0 };
      let totalScore = 0;
      let frozenCount = 0;
      
      for (const rep of reputationAccounts) {
        totalScore += rep.account.creditScore;
        if (rep.account.isFrozen) frozenCount++;
        
        switch (rep.account.creditTier) {
          case 0: tierCounts.A++; break;
          case 1: tierCounts.B++; break;
          case 2: tierCounts.C++; break;
          case 3: tierCounts.D++; break;
        }
      }
      
      const avgScore = (totalScore / reputationAccounts.length).toFixed(0);
      console.log("Average Credit Score:", avgScore);
      console.log("Frozen Accounts:", frozenCount);
      console.log("\nCredit Tier Distribution:");
      console.log("  Tier A:", tierCounts.A);
      console.log("  Tier B:", tierCounts.B);
      console.log("  Tier C:", tierCounts.C);
      console.log("  Tier D:", tierCounts.D);
    }
    console.log();
    
    // Get all loan accounts
    console.log("📋 Loan Breakdown");
    console.log("───────────────────────────────────────");
    const loanAccounts = await program.account.loanAccount.all();
    
    let stateCounts = {
      requested: 0,
      funded: 0,
      active: 0,
      repaid: 0,
      defaulted: 0,
      cancelled: 0,
    };
    
    for (const loan of loanAccounts) {
      if (loan.account.state.requested !== undefined) stateCounts.requested++;
      else if (loan.account.state.funded !== undefined) stateCounts.funded++;
      else if (loan.account.state.active !== undefined) stateCounts.active++;
      else if (loan.account.state.repaid !== undefined) stateCounts.repaid++;
      else if (loan.account.state.defaulted !== undefined) stateCounts.defaulted++;
      else if (loan.account.state.cancelled !== undefined) stateCounts.cancelled++;
    }
    
    console.log("Requested:", stateCounts.requested);
    console.log("Funded (pending withdrawal):", stateCounts.funded);
    console.log("Active:", stateCounts.active);
    console.log("Repaid:", stateCounts.repaid);
    console.log("Defaulted:", stateCounts.defaulted);
    console.log("Cancelled:", stateCounts.cancelled);
    console.log("\n═══════════════════════════════════════\n");
    
  } catch (error) {
    console.error("❌ Failed to fetch statistics:", error.message);
    console.log("\nℹ️  Make sure the protocol is initialized");
    console.log("   Run: ts-node scripts/initialize.ts");
  }
}

getStats()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
