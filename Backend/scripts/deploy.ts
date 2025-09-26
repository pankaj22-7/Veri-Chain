import { ethers } from "hardhat";
import { CertificateNFT } from "../typechain-types";

async function main() {
  console.log("🚀 Deploying VeriChain Certificate NFT with TypeScript...");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (Number(ethers.formatEther(balance)) < 0.01) {
    console.log("⚠️ Warning: Low balance! Get Sepolia ETH from faucet");
  }

  // Deploy contract
  console.log("⏳ Deploying CertificateNFT contract...");
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificate: CertificateNFT = await CertificateNFT.deploy();

  // Wait for deployment
  await certificate.waitForDeployment();
  const contractAddress = await certificate.getAddress();

  console.log("✅ VeriChain Certificate NFT deployed successfully!");
  console.log("📍 Contract address:", contractAddress);

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const deploymentCode = await ethers.provider.getCode(contractAddress);
  if (deploymentCode !== "0x") {
    console.log("✅ Contract deployed and verified on blockchain");
  } else {
    console.log("❌ Contract deployment failed");
    return;
  }

  // Authorize deployer
  console.log("🔐 Authorizing deployer for certificate issuance...");
  try {
    const authTx = await certificate.authorizeInstitution(deployer.address);
    console.log("⏳ Authorization transaction:", authTx.hash);
    await authTx.wait();
    console.log("✅ Deployer authorized successfully!");
  } catch (error) {
    console.log("⚠️ Authorization failed:", error);
  }

  // Final output
  console.log("\n🎉 Deployment completed successfully!");
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│              DEPLOYMENT SUMMARY              │");
  console.log("├─────────────────────────────────────────────┤");
  console.log(`│ Contract Address: ${contractAddress}│`);
  console.log(`│ Network: Sepolia Testnet                     │`);
  console.log(`│ Deployer: ${deployer.address}      │`);
  console.log("└─────────────────────────────────────────────┘");
  
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update CONTRACT_ADDRESS in your React app");
  console.log("3. Test certificate issuance!");
  
  console.log("\n📝 Copy this to your React app:");
  console.log(`const CONTRACT_ADDRESS = "${contractAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
