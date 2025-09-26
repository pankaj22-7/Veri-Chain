import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import {
  ArrowLeftIcon,
  UserIcon,
  WalletIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  EyeIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  HashtagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CpuChipIcon,
  LinkIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { Particles } from 'react-tsparticles'
import { loadSlim } from "tsparticles-slim"
import ipfsService from '../services/ipfsService'
import './CertificateHolder.css'

const CONTRACT_ADDRESS = "0xd20d0A374d034BCA79046bB8bC2cFBB4c307d61c"
const CONTRACT_ABI = [
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function certificates(uint256 tokenId) public view returns (string studentName, string degreeName, uint256 issueDate, string ipfsHash, address issuer)"
]

const sampleCertificates = [
  {
    id: '1',
    studentName: 'John Doe',
    degreeName: 'Bachelor of Computer Science',
    institutionName: 'VeriTech University',
    issueDate: '2024-06-15',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    status: 'verified',
    category: 'Technology',
    gpa: '3.85',
    honors: 'Magna Cum Laude',
    creditsEarned: '120'
  },
  {
    id: '2',
    studentName: 'Jane Smith',
    degreeName: 'Master of Data Science',
    institutionName: 'VeriTech University',
    issueDate: '2024-05-20',
    ipfsHash: 'QmXyZ123ABC456DEF789GHI012JKL345MNO678PQR901STU',
    status: 'verified',
    category: 'Technology',
    gpa: '3.92',
    honors: 'Summa Cum Laude',
    creditsEarned: '60'
  },
  {
    id: '3',
    studentName: 'Alice Johnson',
    degreeName: 'Certificate in Blockchain Development',
    institutionName: 'Tech Institute',
    issueDate: '2024-07-10',
    ipfsHash: 'QmABC123XYZ456DEF789GHI012JKL345MNO678PQR901VWX',
    status: 'verified',
    category: 'Certification',
    gpa: '4.00',
    honors: 'With Distinction',
    creditsEarned: '30'
  }
]

const CertificateHolder = () => {
  const [account, setAccount] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [certificates, setCertificates] = useState(sampleCertificates)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [showCertModal, setShowCertModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('date')
  const [showFilters, setShowFilters] = useState(false)

  const particlesInit = async (engine) => {
    await loadSlim(engine)
  }

  useEffect(() => {
    checkWalletConnection()
  }, [])

const checkWalletConnection = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
        await loadCertificates(accounts[0])
      } else {
        // ✅ NEW: Show sample certificates when no wallet connected
        setCertificates([...sampleCertificates].map(cert => ({ ...cert, isDemo: true })))
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
      setCertificates([...sampleCertificates].map(cert => ({ ...cert, isDemo: true })))
    }
  } else {
    // ✅ NEW: Show sample certificates when no MetaMask
    setCertificates([...sampleCertificates].map(cert => ({ ...cert, isDemo: true })))
  }
}

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to connect your wallet!')
      return
    }

    try {
      setIsLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      
      // Check if on correct network
      const network = await provider.getNetwork()
      if (network.chainId !== 11155111n) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          })
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia test network',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              }],
            })
          }
        }
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      setAccount(address)
      setIsConnected(true)
      await loadCertificates(address)
      
    } catch (error) {
      console.error('Connection failed:', error)
      alert('Failed to connect wallet: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

const loadCertificates = async (walletAddress) => {
  if (!walletAddress) return
  
  setIsLoading(true)
  try {
    console.log('🔍 Loading real certificates for wallet:', walletAddress)
    
    const provider = new ethers.BrowserProvider(window.ethereum)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    
    // ✅ Enhanced: Get balance with better logging
    const balance = await contract.balanceOf(walletAddress)
    const balanceNumber = Number(balance)
    
    console.log(`📊 Wallet ${walletAddress} owns ${balanceNumber} certificates`)
    
    const loadedCertificates = []
    
    // ✅ Enhanced: Load each certificate with detailed real data
    for (let i = 0; i < balanceNumber; i++) {
      try {
        console.log(`🔄 Loading certificate ${i + 1} of ${balanceNumber}...`)
        
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i)
        const tokenIdString = tokenId.toString()
        
        console.log(`📋 Found certificate Token ID: ${tokenIdString}`)
        
        try {
          // ✅ Get real certificate details from blockchain
          const certDetails = await contract.certificates(tokenId)
          
          // ✅ Verify ownership
          const owner = await contract.ownerOf(tokenId)
          
          console.log(`✅ Certificate ${tokenIdString} details:`, {
            studentName: certDetails.studentName,
            degreeName: certDetails.degreeName,
            issueDate: certDetails.issueDate.toString(),
            ipfsHash: certDetails.ipfsHash,
            owner: owner
          })
          
          // ✅ Create certificate object with REAL blockchain data
          loadedCertificates.push({
            id: tokenIdString,
            studentName: certDetails.studentName || `Certificate Holder #${tokenIdString}`,
            degreeName: certDetails.degreeName || `Academic Certificate #${tokenIdString}`,
            institutionName: 'VeriTech University', // Could be extracted from contract in future
            issueDate: certDetails.issueDate ? 
              new Date(Number(certDetails.issueDate) * 1000).toLocaleDateString() : 
              new Date().toLocaleDateString(),
            ipfsHash: certDetails.ipfsHash || '',
            status: 'verified',
            category: 'Academic', // Could be determined from degree name
            isRealNFT: true,
            // ✅ Real blockchain metadata
            owner: owner,
            issuer: certDetails.issuer,
            contractAddress: CONTRACT_ADDRESS,
            chainId: '11155111', // Sepolia
            blockchainVerified: true,
            // ✅ Academic info - could be enhanced later with more contract fields
            gpa: 'N/A', // Add to contract if needed
            honors: 'N/A', // Add to contract if needed  
            creditsEarned: 'N/A' // Add to contract if needed
          })
          
        } catch (detailError) {
          console.log(`⚠️ Could not get details for certificate ${tokenIdString}:`, detailError.message)
          
          // ✅ Even without details, show the certificate exists
          loadedCertificates.push({
            id: tokenIdString,
            studentName: `Certificate Holder #${tokenIdString}`,
            degreeName: `Academic Certificate #${tokenIdString}`,
            institutionName: 'Blockchain Institution',
            issueDate: new Date().toLocaleDateString(),
            ipfsHash: '',
            status: 'verified',
            category: 'Academic',
            isRealNFT: true,
            limitedInfo: true, // Flag for limited info
            gpa: 'N/A',
            honors: 'N/A',
            creditsEarned: 'N/A'
          })
        }
        
      } catch (tokenError) {
        console.error(`❌ Error loading certificate at index ${i}:`, tokenError.message)
        // Continue with next certificate
      }
    }
    
    // ✅ Enhanced: Show real certificates or fall back to samples
    if (loadedCertificates.length === 0) {
      console.log('📝 No real certificates found, showing sample certificates')
      setCertificates([...sampleCertificates].map(cert => ({ ...cert, isDemo: true })))
    } else {
      console.log(`🎉 Successfully loaded ${loadedCertificates.length} REAL certificates`)
      setCertificates(loadedCertificates)
    }
    
  } catch (error) {
    console.error('❌ Error loading real certificates:', error)
    // ✅ Fallback to sample certificates on error
    setCertificates([...sampleCertificates].map(cert => ({ ...cert, isDemo: true })))
  } finally {
    setIsLoading(false)
  }
}


  const disconnectWallet = () => {
    setAccount('')
    setIsConnected(false)
    setCertificates(sampleCertificates)
  }

  const viewCertificate = (certificate) => {
    setSelectedCertificate(certificate)
    setShowCertModal(true)
  }

  const downloadCertificate = (certificate) => {
    if (certificate.ipfsHash) {
      const url = ipfsService.getFileUrl(certificate.ipfsHash)
      window.open(url, '_blank')
    } else {
      alert('Certificate file not available')
    }
  }

  const shareCertificate = (certificate) => {
    const shareUrl = `${window.location.origin}/verify?id=${certificate.id}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const filteredCertificates = certificates
    .filter(cert => {
      if (filterCategory !== 'all' && cert.category !== filterCategory) return false
      if (searchTerm && !cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !cert.degreeName.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.studentName.localeCompare(b.studentName)
        case 'institution':
          return a.institutionName.localeCompare(b.institutionName)
        case 'date':
        default:
          return new Date(b.issueDate) - new Date(a.issueDate)
      }
    })

  const categories = ['all', ...new Set(certificates.map(cert => cert.category))]

  return (
    <div className="certificate-holder-page">
      {/* Enhanced Particles Background */}
      <Particles
        id="holder-particles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 120,
          particles: {
            color: { value: ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981"] },
            links: {
              color: "#06b6d4",
              distance: 120,
              enable: true,
              opacity: 0.15,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: { default: "bounce" },
              random: true,
              speed: 0.5,
              straight: false,
            },
            number: { density: { enable: true, area: 1000 }, value: 30 },
            opacity: { value: 0.3 },
            shape: { type: ["circle", "triangle", "star"] },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        className="particles-background"
      />

      {/* Header */}
      <motion.header 
        className="holder-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="header-left">
            <motion.button 
              className="back-btn"
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
            >
              <ArrowLeftIcon className="icon" />
              Back
            </motion.button>
            
            <div className="header-title">
              <motion.div
                className="title-icon"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <AcademicCapIcon className="icon-large" />
              </motion.div>
              <div className="title-text">
                <h1>My Certificates</h1>
                <p>View and manage your blockchain certificates</p>
              </div>
            </div>
          </div>

          <div className="header-actions">
            {!isConnected ? (
              <motion.button
                className="connect-wallet-btn"
                onClick={connectWallet}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <SparklesIcon className="icon" />
                  </motion.div>
                ) : (
                  <WalletIcon className="icon" />
                )}
                <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
              </motion.button>
            ) : (
              <motion.div 
                className="wallet-connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="wallet-info">
                  <div className="wallet-status">
                    <CheckCircleIcon className="icon status-icon" />
                    <span className="wallet-address">{account.slice(0, 6)}...{account.slice(-4)}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(account)}
                      title="Copy Address"
                    >
                      <ClipboardDocumentIcon className="icon-small" />
                    </button>
                  </div>
                  <div className="wallet-stats">
                    <span className="stat">{certificates.filter(c => c.isRealNFT).length} NFTs</span>
                  </div>
                </div>
                <button 
                  className="disconnect-btn"
                  onClick={disconnectWallet}
                >
                  Disconnect
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      <div className="holder-container">
        {/* Stats Dashboard */}
        <motion.div 
          className="stats-dashboard"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <motion.div 
            className="stat-card total"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="stat-icon">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <DocumentTextIcon className="icon-large" />
              </motion.div>
            </div>
            <div className="stat-content">
              <h3>{certificates.length}</h3>
              <p>Total Certificates</p>
              <span className="stat-trend">+{certificates.length} this month</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card verified"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="stat-icon">
              <CheckCircleIcon className="icon-large" />
            </div>
            <div className="stat-content">
              <h3>{certificates.filter(c => c.status === 'verified').length}</h3>
              <p>Verified</p>
              <span className="stat-trend">100% success rate</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card nft"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="stat-icon">
              <ShieldCheckIcon className="icon-large" />
            </div>
            <div className="stat-content">
              <h3>{certificates.filter(c => c.isRealNFT).length}</h3>
              <p>NFT Certificates</p>
              <span className="stat-trend">Blockchain secured</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card institutions"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="stat-icon">
              <BuildingOffice2Icon className="icon-large" />
            </div>
            <div className="stat-content">
              <h3>{new Set(certificates.map(c => c.institutionName)).size}</h3>
              <p>Institutions</p>
              <span className="stat-trend">Trusted partners</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Controls */}
        <motion.div 
          className="certificates-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="controls-left">
            <div className="search-container">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters-container">
              <motion.button
                className="filters-btn"
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FunnelIcon className="icon" />
                <span>Filters</span>
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDownIcon className="icon-small" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    className="filters-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="filter-group">
                      <label>Category</label>
                      <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Sort By</label>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="date">Issue Date</option>
                        <option value="name">Student Name</option>
                        <option value="institution">Institution</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="controls-right">
            <div className="view-toggle">
              <motion.button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Squares2X2Icon className="icon" />
              </motion.button>
              
              <motion.button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ListBulletIcon className="icon" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Certificates Display */}
        <motion.div 
          className="certificates-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isLoading ? (
            <div className="loading-state">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <SparklesIcon className="loading-icon" />
              </motion.div>
              <h3>Loading your certificates...</h3>
              <p>Fetching data from blockchain...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="empty-state">
              <DocumentTextIcon className="empty-icon" />
              <h3>No certificates found</h3>
              <p>
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : isConnected 
                    ? 'No certificates found in your wallet'
                    : 'Connect your wallet to view your certificates'
                }
              </p>
              {!isConnected && (
                <motion.button
                  className="connect-wallet-btn"
                  onClick={connectWallet}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <WalletIcon className="icon" />
                  <span>Connect Wallet</span>
                </motion.button>
              )}
            </div>
          ) : (
            <div className={`certificates-${viewMode}`}>
              <AnimatePresence>
                {filteredCertificates.map((certificate, index) => (
                  <motion.div
                    key={certificate.id}
                    className="certificate-card"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    layout
                  >
                    {/* Certificate Header */}
                    <div className="certificate-header">
                      <div className="certificate-id">
                        <HashtagIcon className="icon-small" />
                        <span>#{certificate.id}</span>
                        <div className="badges">
                          {certificate.isRealNFT && (
                            <span className="badge nft">NFT</span>
                          )}
                          {certificate.isDemo && (
                            <span className="badge demo">Demo</span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`status-badge ${certificate.status}`}>
                        <CheckCircleIcon className="icon-small" />
                        <span>{certificate.status}</span>
                      </div>
                    </div>

                    {/* Certificate Content */}
                    <div className="certificate-content">
                      <div className="certificate-info">
                        <h3 className="degree-name">{certificate.degreeName}</h3>
                        
                        <div className="certificate-meta">
                          <div className="meta-item">
                            <UserIcon className="icon-small" />
                            <span>{certificate.studentName}</span>
                          </div>
                          <div className="meta-item">
                            <BuildingOffice2Icon className="icon-small" />
                            <span>{certificate.institutionName}</span>
                          </div>
                          <div className="meta-item">
                            <CalendarDaysIcon className="icon-small" />
                            <span>{certificate.issueDate}</span>
                          </div>
                        </div>

                        {certificate.gpa && certificate.gpa !== 'N/A' && (
                          <div className="certificate-achievements">
                            <div className="achievement-item">
                              <span className="achievement-label">GPA:</span>
                              <span className="achievement-value gpa">{certificate.gpa}</span>
                            </div>
                            {certificate.honors && certificate.honors !== 'N/A' && (
                              <div className="achievement-item">
                                <StarIcon className="icon-small" />
                                <span className="achievement-value honors">{certificate.honors}</span>
                              </div>
                            )}
                            {certificate.creditsEarned && certificate.creditsEarned !== 'N/A' && (
                              <div className="achievement-item">
                                <span className="achievement-label">Credits:</span>
                                <span className="achievement-value">{certificate.creditsEarned}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Certificate Actions */}
                      <div className="certificate-actions">
                        <motion.button
                          className="action-btn primary"
                          onClick={() => viewCertificate(certificate)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <EyeIcon className="icon-small" />
                          <span>View</span>
                        </motion.button>

                        {certificate.ipfsHash && (
                          <motion.button
                            className="action-btn secondary"
                            onClick={() => downloadCertificate(certificate)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <DocumentArrowDownIcon className="icon-small" />
                            <span>Download</span>
                          </motion.button>
                        )}

                        <motion.button
                          className="action-btn secondary"
                          onClick={() => shareCertificate(certificate)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ShareIcon className="icon-small" />
                          <span>Share</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Certificate Detail Modal */}
      <AnimatePresence>
        {showCertModal && selectedCertificate && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCertModal(false)}
          >
            <motion.div
              className="certificate-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <DocumentTextIcon className="icon-large" />
                  <div>
                    <h2>Certificate Details</h2>
                    <p>#{selectedCertificate.id} • {selectedCertificate.status}</p>
                  </div>
                </div>
                <button 
                  className="close-btn"
                  onClick={() => setShowCertModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                {/* Certificate Preview */}
                <div className="certificate-preview">
                  {selectedCertificate.ipfsHash ? (
                    <div className="preview-frame">
                      <iframe
                        src={ipfsService.getFileUrl(selectedCertificate.ipfsHash)}
                        width="100%"
                        height="400px"
                        style={{ border: 'none', borderRadius: '8px' }}
                        title="Certificate Preview"
                      />
                    </div>
                  ) : (
                    <div className="preview-placeholder">
                      <DocumentTextIcon className="placeholder-icon" />
                      <p>Certificate preview not available</p>
                      <small>This is a demo certificate without IPFS file</small>
                    </div>
                  )}
                </div>

                {/* Certificate Details */}
                <div className="details-grid">
                  <div className="detail-section">
                    <h4>Certificate Information</h4>
                    <div className="detail-items">
                      <div className="detail-item">
                        <label>Certificate ID</label>
                        <div className="detail-value">
                          <span>#{selectedCertificate.id}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(selectedCertificate.id)}
                          >
                            <ClipboardDocumentIcon className="icon-small" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="detail-item">
                        <label>Student Name</label>
                        <span>{selectedCertificate.studentName}</span>
                      </div>
                      
                      <div className="detail-item">
                        <label>Degree/Program</label>
                        <span>{selectedCertificate.degreeName}</span>
                      </div>
                      
                      <div className="detail-item">
                        <label>Institution</label>
                        <span>{selectedCertificate.institutionName}</span>
                      </div>
                      
                      <div className="detail-item">
                        <label>Issue Date</label>
                        <span>{selectedCertificate.issueDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Academic Information</h4>
                    <div className="detail-items">
                      {selectedCertificate.gpa && selectedCertificate.gpa !== 'N/A' && (
                        <div className="detail-item">
                          <label>GPA</label>
                          <span className="gpa-value">{selectedCertificate.gpa}</span>
                        </div>
                      )}
                      
                      {selectedCertificate.honors && selectedCertificate.honors !== 'N/A' && (
                        <div className="detail-item">
                          <label>Honors</label>
                          <span className="honors-value">{selectedCertificate.honors}</span>
                        </div>
                      )}
                      
                      {selectedCertificate.creditsEarned && selectedCertificate.creditsEarned !== 'N/A' && (
                        <div className="detail-item">
                          <label>Credits Earned</label>
                          <span>{selectedCertificate.creditsEarned}</span>
                        </div>
                      )}
                      
                      <div className="detail-item">
                        <label>Category</label>
                        <span className="category-badge">{selectedCertificate.category}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCertificate.ipfsHash && (
                    <div className="detail-section blockchain">
                      <h4>Blockchain Information</h4>
                      <div className="detail-items">
                        <div className="detail-item">
                          <label>IPFS Hash</label>
                          <div className="detail-value">
                            <span className="hash-text">
                              {selectedCertificate.ipfsHash.slice(0, 10)}...{selectedCertificate.ipfsHash.slice(-8)}
                            </span>
                            <button 
                              className="copy-btn"
                              onClick={() => copyToClipboard(selectedCertificate.ipfsHash)}
                            >
                              <ClipboardDocumentIcon className="icon-small" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="detail-item">
                          <label>Storage</label>
                          <span className="storage-info">
                            <LinkIcon className="icon-small" />
                            Decentralized IPFS
                          </span>
                        </div>
                        
                        <div className="detail-item">
                          <label>Verification</label>
                          <span className="verification-info">
                            <CheckCircleIcon className="icon-small" />
                            Blockchain Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                {selectedCertificate.ipfsHash && (
                  <motion.button
                    className="modal-btn primary"
                    onClick={() => downloadCertificate(selectedCertificate)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <DocumentArrowDownIcon className="icon" />
                    <span>Download Certificate</span>
                  </motion.button>
                )}
                
                <motion.button
                  className="modal-btn secondary"
                  onClick={() => shareCertificate(selectedCertificate)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShareIcon className="icon" />
                  <span>Share Certificate</span>
                </motion.button>

                <motion.button
                  className="modal-btn secondary"
                  onClick={() => {
                    const verifyUrl = `${window.location.origin}/verify?id=${selectedCertificate.id}`
                    window.open(verifyUrl, '_blank')
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GlobeAltIcon className="icon" />
                  <span>Verify Online</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CertificateHolder
