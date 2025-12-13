import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { SollendMicroProtocol } from "../target/types/sollend_micro_protocol";
import fs from "fs";

async function initialize() {
  // Load keypairs from environment or files
  const adminKeypairPath = process.env.ADMIN_KEYPAIR || "./admin-keypair.json";
  const oracleKeypairPath = process.env.ORACLE_KEYPAIR || "./oracle-keypair.json";
  const network = process.env.SOLANA_NETWORK || "devnet";
  
  const adminKeypair = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(adminKeypairPath, "utf-8")))
  );
  
  const oracleKeypair = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(oracleKeypairPath, "utf-8")))
  );

  // Configure provider based on network
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
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load program
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/sollend_micro_protocol.json", "utf-8")
  );
  const programId = new web3.PublicKey(idl.metadata.address);
  const program = new Program(idl, programId, provider) as Program<SollendMicroProtocol>;

  // Derive config PDA
  const [configPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("═══════════════════════════════════════");
  console.log("  Sollend Protocol Initialization");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network);
  console.log("Program ID:", programId.toString());
  console.log("Admin:", adminKeypair.publicKey.toString());
  console.log("Oracle:", oracleKeypair.publicKey.toString());
  console.log("Config PDA:", configPda.toString());
  console.log("═══════════════════════════════════════\n");

  try {
    // Check if already initialized
    const existingConfig = await program.account.protocolConfig.fetch(configPda);
    console.log("⚠️  Protocol already initialized!");
    console.log("Current configuration:");
    console.log("- Authority:", existingConfig.authority.toString());
    console.log("- Oracle:", existingConfig.oracleAuthority.toString());
    console.log("- Fee:", existingConfig.protocolFeeBps, "bps");
    return;
  } catch (error) {
    // Config doesn't exist, proceed with initialization
    console.log("Initializing protocol configuration...\n");
  }

  try {
    const protocolFeeBps = 150; // 1.5% protocol fee
    
    const tx = await program.methods
      .initializeConfig(oracleKeypair.publicKey, protocolFeeBps)
      .accounts({
        config: configPda,
        authority: adminKeypair.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ Protocol initialized successfully!");
    console.log("Transaction signature:", tx);
    console.log("\nWaiting for confirmation...");
    
    await connection.confirmTransaction(tx, "confirmed");
    
    // Fetch and display config
    const config = await program.account.protocolConfig.fetch(configPda);
    console.log("\n═══════════════════════════════════════");
    console.log("  Protocol Configuration");
    console.log("═══════════════════════════════════════");
    console.log("Authority:", config.authority.toString());
    console.log("Oracle Authority:", config.oracleAuthority.toString());
    console.log("Protocol Fee:", config.protocolFeeBps, "bps (", config.protocolFeeBps / 100, "%)");
    console.log("Total Loans Issued:", config.totalLoansIssued.toString());
    console.log("Total Volume:", config.totalVolume.toString());
    console.log("Total Defaults:", config.totalDefaults.toString());
    console.log("Status:", config.isPaused ? "PAUSED ⏸️" : "ACTIVE ✅");
    console.log("═══════════════════════════════════════\n");
    
    console.log("🎉 Protocol is ready to use!");
    console.log("\nNext steps:");
    console.log("1. Set up oracle service: cd oracle && npm install");
    console.log("2. Configure oracle .env file");
    console.log("3. Start oracle: npm run dev");
    console.log("4. Create test accounts and loans");
    
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    throw error;
  }
}

initialize()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
