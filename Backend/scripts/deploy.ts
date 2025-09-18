async function main() {
  console.log("🚀 Deploying VeriChain to Sepolia...");
  
  const provider = new (await import("ethers")).JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new (await import("ethers")).Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);
  
  console.log("📍 Deploying with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Balance:", (Number(balance) / 1e18).toFixed(4), "ETH");
  
  // Import contract factory
  const { abi, bytecode } = await import("../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json");
  
  console.log("📝 Deploying VeriChain Certificate NFT...");
  
  // Create contract factory
  const contractFactory = new (await import("ethers")).ContractFactory(abi, bytecode, wallet);
  
  // Deploy the contract
  const contract = await contractFactory.deploy();
  console.log("⏳ Deployment transaction sent:", contract.deploymentTransaction()?.hash);
  
  // Wait for deployment
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  
  console.log("🎉 VeriChain successfully deployed!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);
  console.log("\n📋 SAVE THIS FOR YOUR REACT APP:");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia Testnet");
}

main().catch(console.error);
