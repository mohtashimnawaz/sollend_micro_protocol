import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as cron from "node-cron";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { LoanMonitor } from "./loanMonitor";
import { Logger } from "./logger";

dotenv.config();

interface OracleConfig {
  rpcUrl: string;
  oracleKeypair: Keypair;
  programId: PublicKey;
  checkIntervalMinutes: number;
  gracePeriodMinutes: number;
}

class OracleService {
  private config: OracleConfig;
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program;
  private loanMonitor: LoanMonitor;
  private logger: Logger;

  constructor(config: OracleConfig) {
    this.config = config;
    this.logger = new Logger(process.env.LOG_LEVEL || "info");
    
    // Initialize connection
    this.connection = new Connection(config.rpcUrl, "confirmed");
    
    // Create provider
    const wallet = new anchor.Wallet(config.oracleKeypair);
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(this.provider);
    
    // Load program
    const idl = this.loadIdl();
    this.program = new Program(idl, config.programId, this.provider);
    
    // Initialize loan monitor
    this.loanMonitor = new LoanMonitor(
      this.program,
      this.connection,
      config.oracleKeypair,
      config.gracePeriodMinutes,
      this.logger
    );
  }

  private loadIdl(): any {
    // Load IDL from the anchor build
    const idlPath = "../target/idl/sollend_micro_protocol.json";
    if (!fs.existsSync(idlPath)) {
      throw new Error(`IDL file not found at ${idlPath}. Run 'anchor build' first.`);
    }
    return JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  }

  async start() {
    this.logger.info("🚀 Oracle Service Starting...");
    this.logger.info(`Oracle Authority: ${this.config.oracleKeypair.publicKey.toString()}`);
    this.logger.info(`Program ID: ${this.config.programId.toString()}`);
    this.logger.info(`Check Interval: ${this.config.checkIntervalMinutes} minutes`);
    
    // Verify oracle authority
    await this.verifyOracleAuthority();
    
    // Run initial check
    await this.runMonitoringCycle();
    
    // Schedule periodic checks
    const cronExpression = `*/${this.config.checkIntervalMinutes} * * * *`;
    cron.schedule(cronExpression, async () => {
      await this.runMonitoringCycle();
    });
    
    this.logger.info("✅ Oracle Service Started Successfully");
    this.logger.info(`Scheduled to run every ${this.config.checkIntervalMinutes} minutes`);
  }

  private async verifyOracleAuthority() {
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        this.config.programId
      );
      
      const configAccount = await this.program.account.protocolConfig.fetch(configPda);
      
      if (!configAccount.oracleAuthority.equals(this.config.oracleKeypair.publicKey)) {
        throw new Error(
          `Oracle keypair public key does not match the oracle authority in config. ` +
          `Expected: ${configAccount.oracleAuthority.toString()}, ` +
          `Got: ${this.config.oracleKeypair.publicKey.toString()}`
        );
      }
      
      this.logger.info("✅ Oracle authority verified");
    } catch (error) {
      this.logger.error("Failed to verify oracle authority:", error);
      throw error;
    }
  }

  private async runMonitoringCycle() {
    this.logger.info("🔍 Starting monitoring cycle...");
    
    try {
      const results = await this.loanMonitor.checkForDefaults();
      
      this.logger.info(`✅ Monitoring cycle completed:`);
      this.logger.info(`   - Active loans checked: ${results.activeLoansChecked}`);
      this.logger.info(`   - Defaults detected: ${results.defaultsDetected}`);
      this.logger.info(`   - Defaults processed: ${results.defaultsProcessed}`);
      this.logger.info(`   - Errors: ${results.errors}`);
    } catch (error) {
      this.logger.error("Error during monitoring cycle:", error);
    }
  }

  async stop() {
    this.logger.info("🛑 Oracle Service Stopping...");
    // Cleanup tasks here if needed
  }
}

// Main execution
async function main() {
  // Load configuration from environment
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const programIdStr = process.env.PROGRAM_ID;
  const keypairPath = process.env.ORACLE_KEYPAIR_PATH;
  const checkIntervalMinutes = parseInt(process.env.CHECK_INTERVAL_MINUTES || "5");
  const gracePeriodMinutes = parseInt(process.env.GRACE_PERIOD_MINUTES || "60");

  if (!programIdStr) {
    throw new Error("PROGRAM_ID environment variable is required");
  }

  if (!keypairPath) {
    throw new Error("ORACLE_KEYPAIR_PATH environment variable is required");
  }

  // Load oracle keypair
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const oracleKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

  // Create config
  const config: OracleConfig = {
    rpcUrl,
    oracleKeypair,
    programId: new PublicKey(programIdStr),
    checkIntervalMinutes,
    gracePeriodMinutes,
  };

  // Start oracle service
  const oracle = new OracleService(config);
  await oracle.start();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await oracle.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await oracle.stop();
    process.exit(0);
  });
}

// Run the oracle
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { OracleService, OracleConfig };
