import { useState } from 'react'
import { ethers } from 'ethers'
import './App.css'

const CONTRACT_ADDRESS = "0x609B79dde0dE6D2A1a740486782E5D14B58FbD2c";
const CONTRACT_ABI = [
  "function issueCertificate(address student, string memory studentName, string memory degreeName) public",
  "function getCertificateDetails(uint256 tokenId) public view returns (tuple(string studentName, string degreeName, uint256 issueDate))",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

function App() {
  const [account, setAccount] = useState('')

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        setAccount(address)
        console.log("✅ Connected:", address)
      } catch (error) {
        console.error("❌ Connection failed:", error)
      }
    } else {
      alert("Please install MetaMask!")
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗 VeriChain</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '3rem', opacity: 0.9 }}>
          Blockchain-Powered Certificate Verification
        </p>

        {!account ? (
          <button 
            onClick={connectWallet}
            style={{
              backgroundColor: '#2563eb',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🦊 Connect MetaMask
          </button>
        ) : (
          <div>
            <p style={{ marginBottom: '2rem' }}>
              ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginTop: '2rem'
            }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '2rem',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <h2>🏫 Issue Certificate</h2>
                <p>University portal for issuing new certificates</p>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '2rem',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <h2>✅ Verify Certificate</h2>
                <p>Public verification portal</p>
              </div>
            </div>
            
            <div style={{ marginTop: '3rem', fontSize: '0.9rem', opacity: 0.7 }}>
              <p>Contract: {CONTRACT_ADDRESS}</p>
              <p>Network: Sepolia Testnet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
