import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { SollendMicroProtocol } from "../target/types/sollend_micro_protocol";
import fs from "fs";

async function verify() {
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
  
  console.log("═══════════════════════════════════════");
  console.log("  Sollend Protocol Verification");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network);
  console.log("RPC URL:", rpcUrl);
  console.log("═══════════════════════════════════════\n");

  let allChecks = true;

  // 1. Check if IDL exists
  console.log("1️⃣  Checking program build...");
  if (fs.existsSync("./target/idl/sollend_micro_protocol.json")) {
    console.log("   ✅ IDL file found");
    
    const idl = JSON.parse(
      fs.readFileSync("./target/idl/sollend_micro_protocol.json", "utf-8")
    );
    const programId = new web3.PublicKey(idl.metadata.address);
    console.log("   Program ID:", programId.toString());
    
    // 2. Check if program is deployed
    console.log("\n2️⃣  Checking deployment...");
    try {
      const programInfo = await connection.getAccountInfo(programId);
      if (programInfo && programInfo.executable) {
        console.log("   ✅ Program deployed");
        console.log("   Program size:", programInfo.data.length, "bytes");
        console.log("   Owner:", programInfo.owner.toString());
      } else {
        console.log("   ❌ Program not found or not executable");
        allChecks = false;
      }
    } catch (error) {
      console.log("   ❌ Failed to fetch program info");
      allChecks = false;
    }
    
    // 3. Check protocol initialization
    console.log("\n3️⃣  Checking protocol initialization...");
    try {
      const wallet = new anchor.Wallet(web3.Keypair.generate());
      const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      const program = new Program(idl, programId, provider) as Program<SollendMicroProtocol>;
      
      const [configPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      const config = await program.account.protocolConfig.fetch(configPda);
      console.log("   ✅ Protocol initialized");
      console.log("   Config PDA:", configPda.toString());
      console.log("   Authority:", config.authority.toString());
      console.log("   Oracle:", config.oracleAuthority.toString());
      console.log("   Fee:", config.protocolFeeBps, "bps");
      console.log("   Status:", config.isPaused ? "PAUSED ⏸️" : "ACTIVE ✅");
    } catch (error) {
      console.log("   ❌ Protocol not initialized");
      console.log("   Run: ts-node scripts/initialize.ts");
      allChecks = false;
    }
    
    // 4. Check program ID consistency
    console.log("\n4️⃣  Checking program ID consistency...");
    const libRsContent = fs.readFileSync(
      "./programs/sollend_micro_protocol/src/lib.rs",
      "utf-8"
    );
    const declareIdMatch = libRsContent.match(/declare_id!\("(.+?)"\)/);
    if (declareIdMatch) {
      const declaredId = declareIdMatch[1];
      if (declaredId === programId.toString()) {
        console.log("   ✅ Program ID matches in lib.rs");
      } else {
        console.log("   ⚠️  Program ID mismatch!");
        console.log("   lib.rs:", declaredId);
        console.log("   IDL:", programId.toString());
        console.log("   Please update lib.rs and rebuild");
        allChecks = false;
      }
    }
    
    // 5. Check test files
    console.log("\n5️⃣  Checking test files...");
    if (fs.existsSync("./tests/sollend_micro_protocol.ts")) {
      console.log("   ✅ Test file exists");
    } else {
      console.log("   ❌ Test file missing");
      allChecks = false;
    }
    
    // 6. Check oracle setup
    console.log("\n6️⃣  Checking oracle service...");
    if (fs.existsSync("./oracle/package.json")) {
      console.log("   ✅ Oracle service files found");
      
      if (fs.existsSync("./oracle/.env")) {
        console.log("   ✅ Oracle .env configured");
      } else {
        console.log("   ⚠️  Oracle .env not found");
        console.log("   Copy ./oracle/.env.example to ./oracle/.env");
      }
    } else {
      console.log("   ❌ Oracle service not found");
      allChecks = false;
    }
    
  } else {
    console.log("   ❌ IDL file not found");
    console.log("   Run: anchor build");
    allChecks = false;
  }
  
  // Summary
  console.log("\n═══════════════════════════════════════");
  if (allChecks) {
    console.log("  ✅ ALL CHECKS PASSED!");
    console.log("═══════════════════════════════════════");
    console.log("\n🎉 Protocol is ready to use!\n");
    console.log("Next steps:");
    console.log("1. View stats: ts-node scripts/stats.ts");
    console.log("2. Start oracle: cd oracle && npm run dev");
    console.log("3. Run tests: anchor test");
  } else {
    console.log("  ⚠️  SOME CHECKS FAILED");
    console.log("═══════════════════════════════════════");
    console.log("\n⚠️  Please address the issues above\n");
  }
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during verification:", error);
    process.exit(1);
  });
