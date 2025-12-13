# Deployment Guide

## Prerequisites

- Solana CLI installed and configured
- Anchor Framework v0.29.0+
- Node.js v16+
- Sufficient SOL for deployment

## Step-by-Step Deployment

### 1. Build the Program

```bash
# Clean previous builds
anchor clean

# Build the program
anchor build

# This generates:
# - target/deploy/sollend_micro_protocol.so (compiled program)
# - target/idl/sollend_micro_protocol.json (interface definition)
# - target/types/sollend_micro_protocol.ts (TypeScript types)
```

### 2. Get Program ID

```bash
# Extract program ID from keypair
solana address -k target/deploy/sollend_micro_protocol-keypair.json
```

### 3. Update Program ID

Update the program ID in two places:

**File: `programs/sollend_micro_protocol/src/lib.rs`**
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**File: `Anchor.toml`**
```toml
[programs.localnet]
sollend_micro_protocol = "YOUR_PROGRAM_ID_HERE"

[programs.devnet]
sollend_micro_protocol = "YOUR_PROGRAM_ID_HERE"

[programs.mainnet]
sollend_micro_protocol = "YOUR_PROGRAM_ID_HERE"
```

### 4. Rebuild with Correct Program ID

```bash
anchor build
```

### 5. Deploy to Network

#### Devnet Deployment

```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Check balance
solana balance

# Airdrop SOL if needed
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show YOUR_PROGRAM_ID
```

#### Mainnet Deployment

```bash
# Configure for mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Check balance (ensure you have enough SOL)
solana balance

# Deploy (costs ~2-3 SOL depending on program size)
anchor deploy --provider.cluster mainnet

# Verify deployment
solana program show YOUR_PROGRAM_ID
```

### 6. Initialize Protocol

Create a script to initialize the protocol configuration:

**File: `scripts/initialize.ts`**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { SollendMicroProtocol } from "../target/types/sollend_micro_protocol";
import fs from "fs";

async function main() {
  // Load keypairs
  const adminKeypair = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("./admin-keypair.json", "utf-8")))
  );
  
  const oracleKeypair = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync("./oracle-keypair.json", "utf-8")))
  );

  // Configure provider
  const connection = new web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load program
  const programId = new web3.PublicKey("YOUR_PROGRAM_ID");
  const idl = JSON.parse(fs.readFileSync("./target/idl/sollend_micro_protocol.json", "utf-8"));
  const program = new Program(idl, programId, provider);

  // Derive config PDA
  const [configPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Initializing protocol config...");
  console.log("Admin:", adminKeypair.publicKey.toString());
  console.log("Oracle:", oracleKeypair.publicKey.toString());
  console.log("Config PDA:", configPda.toString());

  // Initialize config
  const tx = await program.methods
    .initializeConfig(
      oracleKeypair.publicKey,
      150  // 1.5% protocol fee
    )
    .accounts({
      config: configPda,
      authority: adminKeypair.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([adminKeypair])
    .rpc();

  console.log("✅ Protocol initialized!");
  console.log("Transaction:", tx);
  
  // Verify config
  const config = await program.account.protocolConfig.fetch(configPda);
  console.log("\nProtocol Configuration:");
  console.log("- Authority:", config.authority.toString());
  console.log("- Oracle Authority:", config.oracleAuthority.toString());
  console.log("- Protocol Fee:", config.protocolFeeBps, "bps");
  console.log("- Is Paused:", config.isPaused);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run the initialization:
```bash
ts-node scripts/initialize.ts
```

### 7. Set Up Oracle Service

```bash
cd oracle

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your values

# Build
npm run build

# Start oracle (development)
npm run dev

# Or use PM2 for production
npm install -g pm2
pm2 start dist/index.js --name sollend-oracle
pm2 save
```

### 8. Verify Deployment

Create a verification script:

**File: `scripts/verify.ts`**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { SollendMicroProtocol } from "../target/types/sollend_micro_protocol";

async function verify() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.SollendMicroProtocol as Program<SollendMicroProtocol>;
  
  const [configPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  
  console.log("Verifying deployment...\n");
  
  // Check program exists
  const programInfo = await provider.connection.getAccountInfo(program.programId);
  console.log("✅ Program deployed:", program.programId.toString());
  console.log("   Program size:", programInfo.data.length, "bytes");
  
  // Check config initialized
  try {
    const config = await program.account.protocolConfig.fetch(configPda);
    console.log("\n✅ Protocol configured:");
    console.log("   Authority:", config.authority.toString());
    console.log("   Oracle:", config.oracleAuthority.toString());
    console.log("   Fee:", config.protocolFeeBps, "bps");
    console.log("   Status:", config.isPaused ? "PAUSED" : "ACTIVE");
  } catch (error) {
    console.log("\n❌ Protocol not initialized");
    console.log("   Run: ts-node scripts/initialize.ts");
  }
  
  console.log("\n🎉 Deployment verified!");
}

verify();
```

Run verification:
```bash
ts-node scripts/verify.ts
```

## Post-Deployment Checklist

- [ ] Program deployed successfully
- [ ] Program ID updated in all files
- [ ] Protocol config initialized
- [ ] Oracle service running
- [ ] Oracle authority set correctly
- [ ] Admin keypair secured
- [ ] Treasury token account created
- [ ] Tests passing on deployed program
- [ ] Documentation updated with program ID

## Monitoring

### Check Protocol Statistics

```bash
# Create a monitoring script
ts-node scripts/stats.ts
```

**File: `scripts/stats.ts`**

```typescript
import * as anchor from "@coral-xyz/anchor";

async function getStats() {
  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.SollendMicroProtocol;
  
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  
  const config = await program.account.protocolConfig.fetch(configPda);
  
  console.log("\n📊 Protocol Statistics");
  console.log("════════════════════════");
  console.log("Total Loans:", config.totalLoansIssued.toString());
  console.log("Total Volume:", config.totalVolume.toString());
  console.log("Total Defaults:", config.totalDefaults.toString());
  console.log("Status:", config.isPaused ? "PAUSED" : "ACTIVE");
}

getStats();
```

### Monitor Oracle

```bash
# Check oracle logs
pm2 logs sollend-oracle

# Check oracle status
pm2 status
```

## Upgrading the Program

Solana programs can be upgraded if the upgrade authority is set:

```bash
# Build new version
anchor build

# Upgrade deployed program
solana program deploy \
  --program-id target/deploy/sollend_micro_protocol-keypair.json \
  target/deploy/sollend_micro_protocol.so \
  --upgrade-authority ~/.config/solana/id.json

# Or use anchor
anchor upgrade target/deploy/sollend_micro_protocol.so --program-id YOUR_PROGRAM_ID
```

## Security Best Practices

1. **Secure Keypairs**
   - Store admin and oracle keypairs securely
   - Use hardware wallets for mainnet admin keys
   - Rotate oracle keys periodically

2. **Access Control**
   - Limit admin access to trusted parties
   - Consider multi-sig for admin operations
   - Monitor oracle activity

3. **Monitoring**
   - Set up alerts for unusual activity
   - Monitor protocol statistics daily
   - Track oracle uptime

4. **Audits**
   - Get professional security audit before mainnet
   - Bug bounty program for responsible disclosure
   - Regular code reviews

## Troubleshooting

### Deployment Fails

```bash
# Check balance
solana balance

# Increase compute budget
anchor deploy --provider.cluster devnet -- --max-sign-off 10

# Try manual deployment
solana program deploy target/deploy/sollend_micro_protocol.so
```

### Program ID Mismatch

```bash
# Ensure program ID matches in all files
grep -r "YOUR_OLD_PROGRAM_ID" .

# Rebuild after updating
anchor clean
anchor build
```

### Oracle Not Working

```bash
# Check oracle logs
npm run dev  # See detailed logs

# Verify oracle authority
# In your program, ensure oracle public key matches config

# Check RPC connection
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1, "method":"getHealth"}'
```

## Support

If you encounter issues:
1. Check logs for error messages
2. Verify all configuration is correct
3. Test on devnet before mainnet
4. Consult Anchor documentation
5. Reach out on Discord/GitHub

---

**Deployment Date:** _____________  
**Program ID:** _____________  
**Network:** _____________  
**Deployer:** _____________
