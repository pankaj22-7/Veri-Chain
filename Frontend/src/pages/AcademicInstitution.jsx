import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import {
  BuildingOffice2Icon,
  ArrowLeftIcon,
  PlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  DocumentPlusIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PhotoIcon,
  DocumentArrowDownIcon,
  QrCodeIcon,
  EnvelopeIcon,
  UserGroupIcon,
  BoltIcon,
  InformationCircleIcon,
  FireIcon,
  RocketLaunchIcon,
  CpuChipIcon,
  ArrowPathIcon,
   UserIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { Particles } from 'react-tsparticles'
import { loadSlim } from "tsparticles-slim"
import ipfsService from '../services/ipfsService'
import qrService from '../services/qrService'
import emailService from '../services/emailService'
import revocationService from '../services/revocationService'
import analyticsService from '../services/analyticsService'
import batchService from '../services/batchService'
import certificateProcessor from '../services/certificateProcessor'
import certificateViewer from '../services/certificateViewer'
import enhancedCertificateViewer from '../services/enhancedCertificateViewer'
import './AcademicInstitution.css'

// ✅ FIXED: Single contract address and proper ABI
const CONTRACT_ADDRESS = "0xd20d0A374d034BCA79046bB8bC2cFBB4c307d61c"

const CONTRACT_ABI = [
  "function issueCertificate(address recipient, string memory studentName, string memory degreeName, string memory ipfsHash) external returns (uint256)",
  "function certificates(uint256 tokenId) external view returns (string memory studentName, string memory degreeName, uint256 issueDate, string memory ipfsHash, address issuer)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function isRevoked(uint256 tokenId) external view returns (bool)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string studentName, string degreeName, string ipfsHash, address indexed issuer)",
  "event CertificateRevoked(uint256 indexed tokenId, string reason, address indexed revokedBy)"
]

const institutionData = {
  name: 'VeriTech University',
  address: '123 Blockchain Ave, Crypto City',
  phone: '+1 (555) 123-4567',
  email: 'admin@veritech.edu',
  website: 'www.veritech.edu',
  founded: '2015',
  certificatesIssued: 12847
}

const AcademicInstitution = () => {
  // Core state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [account, setAccount] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Enhanced features state
  const [analytics, setAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [batchProgress, setBatchProgress] = useState(null)
  const [showRevocationModal, setShowRevocationModal] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchFile, setBatchFile] = useState(null)
  const [qrCodes, setQrCodes] = useState(new Map())
  const [revocationReason, setRevocationReason] = useState('')
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [selectedCertificateForView, setSelectedCertificateForView] = useState(null)
  const [certificateImageUrl, setCertificateImageUrl] = useState(null)
  const [loadingCertificateImage, setLoadingCertificateImage] = useState(false)
  
  // ✅ ADD THESE MISSING STATE VARIABLES FOR QR PREVIEW
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewCertificate, setPreviewCertificate] = useState(null)
  const [previewQRCode, setPreviewQRCode] = useState(null)
  const [processingPreview, setProcessingPreview] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    studentName: '',
    degreeName: '',
    studentWallet: '',
    studentEmail: '',
    department: '',
    gpa: '',
    honors: '',
    certificateFile: null
  })

  const fileInputRef = useRef(null)
  const batchFileRef = useRef(null)

  // Particles initialization
  const particlesInit = async (engine) => {
    await loadSlim(engine)
  }

  useEffect(() => {
    checkWalletConnection()
  }, [])

  useEffect(() => {
    if (isConnected) {
      if (activeTab === 'dashboard') {
        loadAnalytics()
      } else if (activeTab === 'manage') {
        loadCertificates()
      }
    }
  }, [isConnected, activeTab])

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
          await loadCertificates()
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
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
      await loadCertificates()
      await loadAnalytics()
      
    } catch (error) {
      console.error('Connection failed:', error)
      alert('Failed to connect wallet: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalytics = async () => {
    if (!isConnected) return
    
    setLoadingAnalytics(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const analyticsData = await analyticsService.getAnalytics(provider)
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics)
        console.log('📊 Analytics loaded:', analyticsData.analytics)
      }
    } catch (error) {
      console.error('Analytics loading failed:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const loadCertificates = async () => {
    if (!isConnected) return
    
    setIsLoading(true)
    try {
      console.log('📊 Loading certificates from blockchain...')
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      
      const totalSupply = await contract.totalSupply()
      console.log('📈 Total certificates on blockchain:', totalSupply.toString())
      
      const loadedCertificates = []
      
      for (let i = 1; i <= parseInt(totalSupply.toString()); i++) {
        try {
          const certData = await contract.certificates(i)
          const owner = await contract.ownerOf(i)
          
          let isRevoked = false
          try {
            isRevoked = await contract.isRevoked(i)
          } catch (e) {
            isRevoked = false
          }
          
          const certificate = {
            id: i.toString(),
            studentName: certData.studentName,
            degreeName: certData.degreeName,
            date: new Date(parseInt(certData.issueDate.toString()) * 1000).toLocaleDateString(),
            ipfsHash: certData.ipfsHash,
            issuer: certData.issuer,
            owner: owner,
            status: isRevoked ? 'revoked' : 'issued',
            blockchainVerified: true
          }
          
          loadedCertificates.push(certificate)
          console.log(`✅ Loaded certificate ${i}:`, certificate)
          
        } catch (error) {
          console.warn(`⚠️ Could not load certificate ${i}:`, error.message)
        }
      }
      
      loadedCertificates.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setCertificates(loadedCertificates)
      console.log(`🎉 Successfully loaded ${loadedCertificates.length} certificates from blockchain`)
      
    } catch (error) {
      console.error('❌ Error loading certificates from blockchain:', error)
      setCertificates([])
      alert('Failed to load certificates from blockchain. Please check your connection and contract deployment.')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ ENHANCED: Certificate issuance with automatic QR embedding
  const handleIssueCertificate = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!formData.studentName || !formData.degreeName || !formData.studentWallet) {
      alert('Please fill in all required fields')
      return
    }

    if (!ethers.isAddress(formData.studentWallet)) {
      alert('Please enter a valid Ethereum wallet address')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🔗 Starting enhanced certificate issuance process...')
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      const tempCertId = `CERT_${Date.now()}`
      const verificationURL = certificateProcessor.generateVerificationURL(tempCertId)
      
      let finalFile = null
      let ipfsHash = 'QmDefaultHashForCertificateWithoutFile123456789'
      
      if (formData.certificateFile) {
        console.log('🎨 Processing certificate with QR code embedding...')
        
        try {
          const processResult = await certificateProcessor.processAndEmbedQR(
            formData.certificateFile,
            tempCertId,
            verificationURL
          )
          
          if (processResult.success) {
            finalFile = processResult.enhancedFile
            console.log('✅ Certificate enhanced with QR code')
            
            const previewURL = URL.createObjectURL(finalFile)
            console.log('📁 Enhanced certificate preview:', previewURL)
          } else {
            finalFile = formData.certificateFile
            console.warn('⚠️ Using original file due to processing error')
          }
        } catch (processingError) {
          console.warn('⚠️ QR embedding failed, using original file:', processingError)
          finalFile = formData.certificateFile
        }
      }
      
      if (finalFile) {
        console.log('📤 Uploading enhanced certificate to IPFS...')
        try {
          const uploadResult = await ipfsService.uploadFile(finalFile)
          if (uploadResult.success) {
            ipfsHash = uploadResult.ipfsHash
            console.log('✅ Enhanced certificate uploaded to IPFS:', ipfsHash)
          } else {
            console.warn('⚠️ IPFS upload failed, using default hash')
          }
        } catch (ipfsError) {
          console.warn('⚠️ IPFS upload error:', ipfsError)
        }
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      console.log('🎓 Issuing certificate to blockchain...')
      const tx = await contract.issueCertificate(
        formData.studentWallet,
        formData.studentName,
        formData.degreeName,
        ipfsHash
      )
      
      console.log('⏳ Transaction submitted:', tx.hash)
      const receipt = await tx.wait()
      console.log('✅ Transaction confirmed:', receipt)
      
      let tokenId = null
      try {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log)
            if (parsed && parsed.name === 'CertificateIssued') {
              tokenId = parsed.args.tokenId.toString()
              break
            }
          } catch (parseError) {
            continue
          }
        }
      } catch (logError) {
        console.warn('⚠️ Could not parse logs:', logError)
      }
      
      if (tokenId && tokenId !== tempCertId) {
        console.log('🔄 Updating certificate with real token ID:', tokenId)
      }
      
      const newCertificate = {
        id: tokenId || tempCertId,
        studentName: formData.studentName,
        degreeName: formData.degreeName,
        studentWallet: formData.studentWallet,
        studentEmail: formData.studentEmail,
        department: formData.department,
        gpa: formData.gpa,
        honors: formData.honors,
        date: new Date().toLocaleDateString(),
        status: 'issued',
        txHash: receipt.hash,
        ipfsHash: ipfsHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        hasQRCode: !!finalFile,
        enhancedCertificate: !!finalFile
      }

      if (tokenId) {
        try {
          const qrResult = await qrService.generateCertificateQR(tokenId)
          if (qrResult && qrResult.success) {
            setQrCodes(prev => new Map(prev.set(tokenId, qrResult.qrCodeUrl)))
          }
        } catch (qrError) {
          console.log('Separate QR generation failed:', qrError)
        }
      }

      if (formData.studentEmail) {
        try {
          const emailResult = await emailService.sendCertificateNotification(
            newCertificate,
            formData.studentEmail
          )
          if (emailResult && emailResult.success) {
            newCertificate.emailSent = true
          }
        } catch (emailError) {
          console.log('Email notification failed:', emailError)
        }
      }
      
      setCertificates([newCertificate, ...certificates])
      
      setFormData({
        studentName: '',
        degreeName: '',
        studentWallet: '',
        studentEmail: '',
        department: '',
        gpa: '',
        honors: '',
        certificateFile: null
      })
      
      await loadAnalytics()
      
      console.log('🎉 Enhanced certificate issuance completed!')
      
      alert(`🎉 NFT Certificate issued with embedded QR code!\n\n📋 Details:\n• Token ID: ${tokenId || tempCertId}\n• Transaction: ${receipt.hash}\n• Block: ${receipt.blockNumber}\n• QR Code: ${finalFile ? 'Embedded in certificate ✅' : 'Available separately 📱'}\n• IPFS: ${ipfsHash}\n${newCertificate.emailSent ? '• Email notification sent ✉️' : ''}\n\n🎯 The certificate includes a QR code for instant verification!`)
      
    } catch (error) {
      console.error('❌ Enhanced certificate issuance failed:', error)
      alert('Certificate issuance failed: ' + (error.message || 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ ADD THESE MISSING FUNCTIONS FOR QR PREVIEW
  const generateCertificatePreview = async () => {
    if (!formData.studentName || !formData.degreeName || !formData.certificateFile) {
      alert('Please fill in all required fields and upload a certificate file to preview.')
      return
    }

    setProcessingPreview(true)
    setShowPreviewModal(true)
    
    try {
      console.log('🖼️ Generating certificate preview with QR code...')
      
      const previewCertId = `PREVIEW_${Date.now()}`
      const verificationURL = certificateProcessor.generateVerificationURL(previewCertId)
      
      const processResult = await certificateProcessor.processAndEmbedQR(
        formData.certificateFile,
        previewCertId,
        verificationURL
      )
      
      if (processResult.success) {
        const previewURL = URL.createObjectURL(processResult.enhancedFile)
        
        setPreviewCertificate({
          previewURL,
          enhancedFile: processResult.enhancedFile,
          originalFileName: formData.certificateFile.name,
          studentName: formData.studentName,
          degreeName: formData.degreeName,
          verificationURL: processResult.verificationUrl
        })
        
        setPreviewQRCode(processResult.qrCodeUrl)
        
        console.log('✅ Certificate preview generated successfully')
      } else {
        throw new Error('Failed to generate preview')
      }
      
    } catch (error) {
      console.error('❌ Preview generation failed:', error)
      alert('Failed to generate preview: ' + error.message)
      setShowPreviewModal(false)
    } finally {
      setProcessingPreview(false)
    }
  }

  const closePreviewModal = () => {
    if (previewCertificate?.previewURL) {
      URL.revokeObjectURL(previewCertificate.previewURL)
    }
    setShowPreviewModal(false)
    setPreviewCertificate(null)
    setPreviewQRCode(null)
  }

  // Rest of your existing functions...
  const handleBatchProcess = async () => {
    if (!batchFile) {
      alert('Please select a CSV file')
      return
    }

    try {
      setIsLoading(true)
      setBatchProgress({ current: 0, total: 0, status: 'Parsing CSV file...', percentage: 0 })
      
      const parseResult = await batchService.parseCSVFile(batchFile)
      if (!parseResult.success) {
        throw new Error(parseResult.error)
      }

      const { certificates: batchCertificates } = parseResult
      
      if (batchCertificates.length === 0) {
        throw new Error('No valid certificates found in CSV file')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const batchResult = await batchService.processBatchIssuance(
        batchCertificates,
        provider,
        setBatchProgress
      )

      if (batchResult.success) {
        const { summary, results } = batchResult
        
        const successfulCerts = results
          .filter(r => r.success)
          .map(r => ({
            id: r.tokenId,
            studentName: r.studentName,
            date: new Date(r.issueDate).toLocaleDateString(),
            status: 'issued',
            txHash: r.transactionHash
          }))
        
        setCertificates([...successfulCerts, ...certificates])
        
        alert(`✅ Batch processing completed!\n` +
              `Successful: ${summary.successful}\n` +
              `Failed: ${summary.failed}\n` +
              `Success Rate: ${summary.successRate}%`)
        
        setBatchFile(null)
        setShowBatchModal(false)
        setBatchProgress(null)
        await loadAnalytics()
      }
      
    } catch (error) {
      console.error('Batch processing failed:', error)
      alert('❌ Batch processing failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeCertificate = async () => {
    if (!selectedCertificate || !revocationReason.trim()) {
      alert('Please provide a revocation reason')
      return
    }

    try {
      setIsLoading(true)
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const revocationResult = await revocationService.revokeCertificate(
        selectedCertificate.id,
        revocationReason,
        provider
      )

      if (revocationResult.success) {
        setCertificates(prev => 
          prev.map(cert => 
            cert.id === selectedCertificate.id 
              ? { ...cert, status: 'revoked', revocationReason: revocationReason }
              : cert
          )
        )
        
        alert('✅ Certificate revoked successfully')
        setShowRevocationModal(false)
        setSelectedCertificate(null)
        setRevocationReason('')
        await loadAnalytics()
      } else {
        throw new Error(revocationResult.error)
      }
      
    } catch (error) {
      console.error('Certificate revocation failed:', error)
      alert('❌ Certificate revocation failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQRCode = (certificateId) => {
    const qrCodeUrl = qrCodes.get(certificateId)
    if (qrCodeUrl) {
      qrService.downloadQRCode(qrCodeUrl, certificateId)
    } else {
      qrService.generateCertificateQR(certificateId).then(result => {
        if (result.success) {
          setQrCodes(prev => new Map(prev.set(certificateId, result.qrCodeUrl)))
          qrService.downloadQRCode(result.qrCodeUrl, certificateId)
        }
      })
    }
  }

  const filteredCertificates = certificates.filter(cert =>
    cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.degreeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

const handleViewCertificate = async (certificate) => {
  setSelectedCertificateForView(certificate)
  setShowCertificateModal(true)
  setLoadingCertificateImage(true)
  setCertificateImageUrl(null)

  try {
    console.log('🖼️ Loading certificate with QR code overlay...')
    console.log('📋 Certificate Details:', {
      id: certificate.id,
      student: certificate.studentName,
      degree: certificate.degreeName,
      ipfsHash: certificate.ipfsHash,
      hasQRCode: certificate.hasQRCode || certificate.enhancedCertificate
    })
    
    // Use enhanced certificate viewer with QR overlay
    const result = await enhancedCertificateViewer.viewCertificateWithQR(certificate)
    
    if (result.success) {
      // Use enhanced URL with QR code overlay
      setCertificateImageUrl(result.enhancedUrl)
      console.log('✅ Certificate with QR code overlay loaded successfully')
      console.log('🔗 Original URL:', result.originalUrl)
      console.log('🎨 Enhanced URL:', result.enhancedUrl)
      console.log('📱 QR Code URL:', result.qrCodeUrl)
      console.log('🔍 Verification URL:', result.verificationUrl)
      
      // Store additional data for cleanup and reference
      setSelectedCertificateForView(prev => ({
        ...prev,
        originalImageUrl: result.originalUrl,
        enhancedImageUrl: result.enhancedUrl,
        qrCodeUrl: result.qrCodeUrl,
        verificationUrl: result.verificationUrl
      }))
      
    } else {
      console.warn('⚠️ Failed to enhance certificate with QR code:', result.error)
      
      // Fallback: try to load original certificate
      try {
        const originalResult = await certificateViewer.loadCertificateImage(certificate.ipfsHash)
        if (originalResult.success) {
          setCertificateImageUrl(originalResult.imageUrl)
          console.log('📄 Loaded original certificate without QR enhancement')
        } else {
          setCertificateImageUrl(null)
          console.log('❌ Could not load certificate image')
        }
      } catch (fallbackError) {
        setCertificateImageUrl(null)
        console.error('❌ Fallback loading also failed:', fallbackError)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to load certificate:', error)
    setCertificateImageUrl(null)
  } finally {
    setLoadingCertificateImage(false)
  }
}

// ✅ Add cleanup function for blob URLs
const closeCertificateModal = () => {
  // Cleanup any blob URLs to prevent memory leaks
  if (selectedCertificateForView?.enhancedImageUrl) {
    enhancedCertificateViewer.cleanupUrl(selectedCertificateForView.enhancedImageUrl)
  }
  
  setShowCertificateModal(false)
  setSelectedCertificateForView(null)
  setCertificateImageUrl(null)
}

  return (
    <div className="enhanced-institution-page">
      {/* Particles Background */}
      <Particles
        id="institution-particles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 120,
          particles: {
            color: { value: ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"] },
            links: {
              color: "#06b6d4",
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: { default: "bounce" },
              random: true,
              speed: 0.8,
              straight: false,
            },
            number: { density: { enable: true, area: 1200 }, value: 40 },
            opacity: { value: 0.3 },
            shape: { type: ["circle", "triangle"] },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        className="particles-bg"
      />

      {/* Enhanced Header */}
      <motion.header 
        className="enhanced-header"
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
              <span>Back</span>
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
                <BuildingOffice2Icon className="icon-large" />
              </motion.div>
              <div className="title-text">
                <h1>{institutionData.name}</h1>
                <p>Blockchain Certificate Management Platform</p>
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
                  <LockClosedIcon className="icon" />
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
                  <CheckCircleIcon className="status-icon" />
                  <div className="wallet-details">
                    <span className="wallet-address">{account.slice(0, 6)}...{account.slice(-4)}</span>
                    <small>Sepolia Testnet</small>
                  </div>
                </div>
                <button 
                  className="disconnect-btn"
                  onClick={() => setIsConnected(false)}
                >
                  Disconnect
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      <div className="enhanced-container">
        {/* Enhanced Navigation */}
        <motion.nav 
          className="enhanced-nav"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <div className="nav-tabs">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
              { id: 'issue', label: 'Issue Certificate', icon: DocumentPlusIcon },
              { id: 'manage', label: 'Manage Certificates', icon: ClipboardDocumentListIcon },
              { id: 'batch', label: 'Batch Operations', icon: UserGroupIcon },
              { id: 'settings', label: 'Settings', icon: CogIcon }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="tab-icon" />
                <span className="tab-label">{tab.label}</span>
                {tab.id === 'batch' && (
                  <span className="tab-badge">New</span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.nav>

        {/* Enhanced Tab Content */}
        <motion.div 
          className="enhanced-tab-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                className="dashboard-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Institution Overview */}
                <div className="institution-overview">
                  <div className="overview-card">
                    <div className="overview-header">
                      <h2>Institution Overview</h2>
                      <span className="last-updated">
                        Last updated: {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="overview-stats">
                      <div className="overview-item">
                        <span className="overview-label">Founded</span>
                        <span className="overview-value">{institutionData.founded}</span>
                      </div>
                      <div className="overview-item">
                        <span className="overview-label">Contact</span>
                        <span className="overview-value">{institutionData.email}</span>
                      </div>
                      <div className="overview-item">
                        <span className="overview-label">Network</span>
                        <span className="overview-value">Ethereum Sepolia</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Dashboard */}
                {loadingAnalytics ? (
                  <div className="loading-analytics">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CpuChipIcon className="loading-icon" />
                    </motion.div>
                    <h3>Loading Analytics...</h3>
                    <p>Fetching real-time blockchain data</p>
                  </div>
                ) : analytics ? (
                  <div className="analytics-dashboard">
                    {/* Key Metrics */}
                    <div className="metrics-grid">
                      <motion.div 
                        className="metric-card total"
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="metric-icon">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <DocumentTextIcon className="icon-large" />
                          </motion.div>
                        </div>
                        <div className="metric-content">
                          <h3>{analytics.overview.totalCertificates}</h3>
                          <p>Total Certificates</p>
                          <span className="metric-trend">All time records</span>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="metric-card month"
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="metric-icon">
                          <CalendarDaysIcon className="icon-large" />
                        </div>
                        <div className="metric-content">
                          <h3>{analytics.overview.thisMonthIssued}</h3>
                          <p>This Month</p>
                          <span className={`metric-trend ${analytics.overview.growthRate >= 0 ? 'positive' : 'negative'}`}>
                            {analytics.overview.growthRate > 0 ? '+' : ''}{analytics.overview.growthRate}% growth
                          </span>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="metric-card verified"
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="metric-icon">
                          <CheckCircleIcon className="icon-large" />
                        </div>
                        <div className="metric-content">
                          <h3>{analytics.overview.totalVerifications}</h3>
                          <p>Total Verifications</p>
                          <span className="metric-trend">100% success rate</span>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="metric-card average"
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="metric-icon">
                          <BoltIcon className="icon-large" />
                        </div>
                        <div className="metric-content">
                          <h3>{analytics.overview.averageDaily}</h3>
                          <p>Daily Average</p>
                          <span className="metric-trend">This month</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Charts and Activity */}
                    <div className="dashboard-grid">
                      {/* Department Distribution */}
                      <div className="chart-card">
                        <div className="chart-header">
                          <h3>Department Distribution</h3>
                          <span className="chart-subtitle">Current semester breakdown</span>
                        </div>
                        <div className="department-chart">
                          {analytics.departmentBreakdown.slice(0, 5).map((dept, index) => (
                            <motion.div 
                              key={index}
                              className="chart-bar"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                              <div className="bar-info">
                                <span className="bar-label">{dept.department}</span>
                                <span className="bar-count">{dept.count}</span>
                              </div>
                              <div className="bar-container">
                                <motion.div 
                                  className="bar-fill"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${dept.percentage}%` }}
                                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                                />
                                <span className="bar-percentage">{dept.percentage}%</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="activity-card">
                        <div className="activity-header">
                          <h3>Recent Activity</h3>
                          <span className="activity-subtitle">Latest certificate issuance</span>
                        </div>
                        <div className="activity-list">
                          {analytics.recentActivity.slice(0, 6).map((cert, index) => (
                            <motion.div 
                              key={index}
                              className="activity-item"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                            >
                              <div className="activity-icon">
                                <DocumentCheckIcon className="icon-small" />
                              </div>
                              <div className="activity-content">
                                <p className="activity-title">{cert.studentName}</p>
                                <span className="activity-description">{cert.degreeName}</span>
                              </div>
                              <span className="activity-time">
                                {new Date(cert.issueDate).toLocaleDateString()}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Top Degrees */}
                      <div className="degrees-card">
                        <div className="degrees-header">
                          <h3>Popular Degrees</h3>
                          <span className="degrees-subtitle">Most issued certificates</span>
                        </div>
                        <div className="degrees-list">
                          {analytics.topDegrees.slice(0, 5).map((degree, index) => (
                            <motion.div 
                              key={index}
                              className="degree-item"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                            >
                              <div className="degree-rank">#{index + 1}</div>
                              <div className="degree-content">
                                <p className="degree-name">{degree.degree}</p>
                                <span className="degree-count">{degree.count} certificates</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-analytics">
                    <InformationCircleIcon className="info-icon" />
                    <h3>Analytics Unavailable</h3>
                    <p>Connect your wallet to view real-time analytics</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Issue Certificate Tab */}
            {activeTab === 'issue' && (
              <motion.div
                key="issue"
                className="issue-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="issue-header">
                  <div className="issue-title">
                    <h2>Issue New Certificate</h2>
                    <p>Create a blockchain-secured academic certificate with NFT technology</p>
                  </div>
                  <div className="issue-features">
                    <div className="feature-badge">
                      <ShieldCheckIcon className="feature-icon" />
                      <span>Blockchain Secured</span>
                    </div>
                    <div className="feature-badge">
                      <QrCodeIcon className="feature-icon" />
                      <span>QR Code Generated</span>
                    </div>
                    <div className="feature-badge">
                      <EnvelopeIcon className="feature-icon" />
                      <span>Email Notifications</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleIssueCertificate} className="enhanced-form">
                  <div className="form-sections">
                    {/* Student Information */}
                    <motion.div 
                      className="form-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      <div className="section-header">
                        <h3>Student Information</h3>
                        <span className="section-subtitle">Personal details of the certificate recipient</span>
                      </div>
                      <div className="section-fields">
                        <div className="field-row">
                          <div className="form-field">
                            <label htmlFor="studentName">Full Name *</label>
                            <input
                              type="text"
                              id="studentName"
                              value={formData.studentName}
                              onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                              placeholder="Enter student's full name"
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor="studentWallet">Wallet Address *</label>
                            <input
                              type="text"
                              id="studentWallet"
                              value={formData.studentWallet}
                              onChange={(e) => setFormData({...formData, studentWallet: e.target.value})}
                              placeholder="0x..."
                              required
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label htmlFor="studentEmail">Email Address</label>
                          <input
                            type="email"
                            id="studentEmail"
                            value={formData.studentEmail}
                            onChange={(e) => setFormData({...formData, studentEmail: e.target.value})}
                            placeholder="student@example.com"
                          />
                          <small className="field-hint">Automatic email notifications will be sent</small>
                        </div>
                      </div>
                    </motion.div>

                    {/* Academic Information */}
                    <motion.div 
                      className="form-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <div className="section-header">
                        <h3>Academic Information</h3>
                        <span className="section-subtitle">Certificate and academic achievement details</span>
                      </div>
                      <div className="section-fields">
                        <div className="form-field">
                          <label htmlFor="degreeName">Degree/Program Name *</label>
                          <input
                            type="text"
                            id="degreeName"
                            value={formData.degreeName}
                            onChange={(e) => setFormData({...formData, degreeName: e.target.value})}
                            placeholder="e.g., Bachelor of Computer Science"
                            required
                          />
                        </div>
                        <div className="field-row">
                          <div className="form-field">
                            <label htmlFor="department">Department</label>
                            <select
                              id="department"
                              value={formData.department}
                              onChange={(e) => setFormData({...formData, department: e.target.value})}
                            >
                              <option value="">Select Department</option>
                              <option value="Computer Science">Computer Science</option>
                              <option value="Engineering">Engineering</option>
                              <option value="Business">Business</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="Education">Education</option>
                            </select>
                          </div>
                          <div className="form-field">
                            <label htmlFor="gpa">GPA</label>
                            <input
                              type="text"
                              id="gpa"
                              value={formData.gpa}
                              onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                              placeholder="e.g., 3.85"
                            />
                          </div>
                        </div>
                        <div className="form-field">
                          <label htmlFor="honors">Honors/Distinction</label>
                          <select
                            id="honors"
                            value={formData.honors}
                            onChange={(e) => setFormData({...formData, honors: e.target.value})}
                          >
                            <option value="">Select Honors</option>
                            <option value="Summa Cum Laude">Summa Cum Laude</option>
                            <option value="Magna Cum Laude">Magna Cum Laude</option>
                            <option value="Cum Laude">Cum Laude</option>
                            <option value="With Distinction">With Distinction</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>

                    {/* Certificate Document */}
                    <motion.div 
                      className="form-section"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <div className="section-header">
                        <h3>Certificate Document</h3>
                        <span className="section-subtitle">Upload the official certificate document (optional)</span>
                      </div>
                      <div className="upload-section">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setFormData({...formData, certificateFile: e.target.files[0]})}
                          style={{ display: 'none' }}
                        />
                        
                        {!formData.certificateFile ? (
                          <div 
                            className="upload-area"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <CloudArrowUpIcon className="upload-icon" />
                            <div className="upload-content">
                              <p className="upload-title">Click to upload certificate document</p>
                              <span className="upload-subtitle">PDF, JPG, or PNG • Max 10MB • Stored on IPFS</span>
                            </div>
                          </div>
                        ) : (
                          <div className="uploaded-file">
                            <PhotoIcon className="file-icon" />
                            <div className="file-content">
                              <span className="file-name">{formData.certificateFile.name}</span>
                              <span className="file-size">
                                {(formData.certificateFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, certificateFile: null})}
                              className="remove-file"
                            >
                              <XCircleIcon className="icon-small" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* ✅ UPDATED: Enhanced Form Actions with QR Preview */}
                  <motion.div 
                    className="form-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    {/* Preview with QR Button */}
                    <button
                      type="button"
                      className="preview-btn"
                      onClick={generateCertificatePreview}
                      disabled={!formData.studentName || !formData.degreeName || !formData.certificateFile || processingPreview}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#8b5cf6',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {processingPreview ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <SparklesIcon className="icon" />
                          </motion.div>
                          <span>Generating Preview...</span>
                        </>
                      ) : (
                        <>
                          <EyeIcon className="icon" />
                          <span>Preview with QR</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="preview-btn"
                      onClick={() => setShowEmailPreview(true)}
                      disabled={!formData.studentName || !formData.degreeName}
                    >
                      <EyeIcon className="icon" />
                      <span>Preview Email</span>
                    </button>
                    
                    <button
                      type="submit"
                      className="issue-btn"
                      disabled={isLoading || !isConnected || !formData.studentName || !formData.degreeName || !formData.studentWallet}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <SparklesIcon className="icon" />
                          </motion.div>
                          <span>Issuing Certificate...</span>
                        </>
                      ) : (
                        <>
                          <RocketLaunchIcon className="icon" />
                          <span>Issue Certificate</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* Keep all your other existing tabs (manage, batch, settings) exactly the same... */}
            {activeTab === 'manage' && (
              <motion.div
                key="manage"
                className="manage-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="manage-header">
                  <div className="manage-title">
                    <h2>Certificate Management</h2>
                    <p>View, edit, and manage all issued certificates</p>
                  </div>
                  <div className="manage-tools">
                    <button 
                      className="refresh-btn"
                      onClick={() => loadCertificates()}
                      disabled={isLoading}
                      title="Refresh certificates from blockchain"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: '#06b6d4',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <SparklesIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        </motion.div>
                      ) : (
                        <ArrowPathIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      )}
                      {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                    
                    <div className="search-box">
                      <MagnifyingGlassIcon className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search certificates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="manage-stats">
                      <span className="total-certificates">
                        {filteredCertificates.length} of {certificates.length} certificates
                      </span>
                    </div>
                  </div>
                </div>

                <div className="certificates-container">
                  {filteredCertificates.length > 0 ? (
                    <div className="certificates-grid">
                      {filteredCertificates.map((cert, index) => (
                        <motion.div
                          key={cert.id}
                          className={`certificate-card ${cert.status}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          whileHover={{ y: -8, scale: 1.02 }}
                        >
                          <div className="card-header">
                            <div className="certificate-id">
                              <span className="id-label">#{cert.id}</span>
                              <div className={`status-badge ${cert.status}`}>
                                {cert.status === 'issued' ? (
                                  <CheckCircleIcon className="status-icon" />
                                ) : (
                                  <XCircleIcon className="status-icon" />
                                )}
                                <span>{cert.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="card-content">
                            <h4 className="student-name">{cert.studentName}</h4>
                            <p className="degree-name">{cert.degreeName}</p>
                            <div className="card-meta">
                              <div className="meta-item">
                                <CalendarDaysIcon className="meta-icon" />
                                <span>{cert.date}</span>
                              </div>
                              {cert.department && (
                                <div className="meta-item">
                                  <BuildingOffice2Icon className="meta-icon" />
                                  <span>{cert.department}</span>
                                </div>
                              )}
                              {cert.gpa && (
                                <div className="meta-item">
                                  <span className="gpa-badge">GPA: {cert.gpa}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="card-actions" style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            padding: '1rem', 
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
                            justifyContent: 'center' 
                          }}>
                            <button 
                              className="action-btn view"
                              title="View Certificate"
                              onClick={() => handleViewCertificate(cert)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '2.5rem',
                                height: '2.5rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <EyeIcon style={{ 
                                width: '1rem', 
                                height: '1rem', 
                                color: '#3b82f6' 
                              }} />
                            </button>
                                            
                            <button 
                              className="action-btn qr"
                              onClick={() => downloadQRCode(cert.id)}
                              title="Download QR Code"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '2.5rem',
                                height: '2.5rem',
                                background: 'rgba(139, 92, 246, 0.1)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <QrCodeIcon style={{ 
                                width: '1rem', 
                                height: '1rem', 
                                color: '#8b5cf6' 
                              }} />
                            </button>

                            {cert.studentEmail && (
                              <button 
                                className="action-btn email"
                                onClick={async () => {
                                  try {
                                    await emailService.sendCertificateNotification(cert, cert.studentEmail);
                                    alert(`📧 Email notification sent to ${cert.studentEmail}`);
                                  } catch (error) {
                                    alert('❌ Failed to send email notification');
                                  }
                                }}
                                title="Send Email Notification"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '2.5rem',
                                  height: '2.5rem',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <EnvelopeIcon style={{ 
                                  width: '1rem', 
                                  height: '1rem', 
                                  color: '#10b981' 
                                }} />
                              </button>
                            )}

                            {cert.status !== 'revoked' && (
                              <button 
                                className="action-btn revoke"
                                onClick={() => {
                                  setSelectedCertificate(cert);
                                  setShowRevocationModal(true);
                                }}
                                title="Revoke Certificate"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '2.5rem',
                                  height: '2.5rem',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <TrashIcon style={{ 
                                  width: '1rem', 
                                  height: '1rem', 
                                  color: '#ef4444' 
                                }} />
                              </button>
                            )}

                            <button 
                              className="action-btn download"
                              onClick={() => {
                                const certificateData = {
                                  id: cert.id,
                                  studentName: cert.studentName,
                                  degreeName: cert.degreeName,
                                  date: cert.date,
                                  issuer: 'VeriTech University',
                                  status: cert.status,
                                  blockchain: 'Ethereum Sepolia',
                                  transaction: cert.txHash || 'N/A',
                                  ipfsHash: cert.ipfsHash || 'N/A'
                                };
                                
                                const dataStr = JSON.stringify(certificateData, null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `certificate-${cert.id}-${cert.studentName.replace(/\s+/g, '-')}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                                
                                alert('📁 Certificate data downloaded successfully!');
                              }}
                              title="Download Certificate Data"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '2.5rem',
                                height: '2.5rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <DocumentArrowDownIcon style={{ 
                                width: '1rem', 
                                height: '1rem', 
                                color: '#f59e0b' 
                              }} />
                            </button>
                          </div>

                          <div className="card-footer" style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>
                              {cert.txHash ? (
                                <>🔗 On-chain verified</>
                              ) : (
                                <>📄 Local record</>
                              )}
                            </span>
                            {cert.ipfsHash && (
                              <span title={`IPFS: ${cert.ipfsHash}`}>
                                📁 File stored
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-certificates" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4rem 2rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <DocumentTextIcon style={{
                        width: '4rem',
                        height: '4rem',
                        color: 'rgba(255, 255, 255, 0.3)',
                        marginBottom: '1rem'
                      }} />
                      <h3 style={{ fontSize: '1.5rem', margin: '1rem 0 0.5rem 0', color: 'white' }}>
                        No certificates found
                      </h3>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1rem' }}>
                        {searchTerm 
                          ? `No certificates match "${searchTerm}"`
                          : 'No certificates have been issued yet. Create your first certificate in the "Issue Certificate" tab.'
                        }
                      </p>
                      {!searchTerm && (
                        <button 
                          onClick={() => setActiveTab('issue')}
                          style={{
                            marginTop: '1.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                          Issue First Certificate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Keep all your other tabs (batch, settings) exactly as they are... */}
            
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ✅ Certificate Viewer Modal */}
      <AnimatePresence>
        {showCertificateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCertificateModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              className="certificate-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                width: '95%',
                maxWidth: '1200px',
                maxHeight: '95vh',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>
                    Certificate Details
                  </h3>
                  {selectedCertificateForView && (
                    <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {selectedCertificateForView.studentName} • {selectedCertificateForView.degreeName}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedCertificateForView && selectedCertificateForView.ipfsHash && (
                    <button
                      onClick={async () => {
                        try {
                          await certificateViewer.downloadCertificate(
                            selectedCertificateForView.ipfsHash,
                            selectedCertificateForView.id,
                            selectedCertificateForView.studentName
                          )
                          alert('📁 Certificate downloaded successfully!')
                        } catch (error) {
                          alert('❌ Download failed: ' + error.message)
                        }
                      }}
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      📁 Download
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowCertificateModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: 'white',
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                height: 'calc(95vh - 120px)',
                maxHeight: '800px'
              }}>
                <div style={{
                  flex: '2',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {loadingCertificateImage ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <SparklesIcon style={{ width: '3rem', height: '3rem', color: '#06b6d4' }} />
                      </motion.div>
                      <p>Loading certificate image...</p>
                    </div>
                  ) : certificateImageUrl ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={certificateImageUrl}
                        alt="Certificate"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center'
                    }}>
                      <DocumentTextIcon style={{ width: '4rem', height: '4rem' }} />
                      <h4 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
                        Certificate Image Not Available
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        This certificate was issued without an image file or the file is not accessible from IPFS.
                      </p>
                    </div>
                  )}
                </div>
                
                <div style={{
                  flex: '1',
                  padding: '2rem',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ 
                    margin: '0 0 1.5rem 0', 
                    color: 'white',
                    fontSize: '1.25rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '0.5rem'
                  }}>
                    Certificate Information
                  </h4>
                  
                  {selectedCertificateForView && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>Student Name</span>
                          <p style={{ margin: '0.25rem 0', color: 'white', fontWeight: '600' }}>
                            {selectedCertificateForView.studentName}
                          </p>
                        </div>
                        
                        <div style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>Degree Program</span>
                          <p style={{ margin: '0.25rem 0', color: 'white', fontWeight: '600' }}>
                            {selectedCertificateForView.degreeName}
                          </p>
                        </div>
                        
                        <div style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>Issue Date</span>
                          <p style={{ margin: '0.25rem 0', color: 'white', fontWeight: '600' }}>
                            {selectedCertificateForView.date}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.05)',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(6, 182, 212, 0.2)'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#06b6d4', fontSize: '1rem' }}>
                          🔗 Blockchain Details
                        </h5>
                        
                        <div style={{ fontSize: '0.85rem' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Token ID: </span>
                            <span style={{ color: 'white', fontFamily: 'monospace' }}>
                              #{selectedCertificateForView.id}
                            </span>
                          </div>
                          
                          <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Status: </span>
                            <span style={{ 
                              color: selectedCertificateForView.status === 'issued' ? '#10b981' : '#ef4444',
                              textTransform: 'capitalize',
                              fontWeight: '600'
                            }}>
                              {selectedCertificateForView.status === 'issued' ? '✅ Active' : '❌ Revoked'}
                            </span>
                          </div>
                          
                          {selectedCertificateForView.txHash && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Transaction: </span>
                              <span style={{ 
                                color: '#06b6d4', 
                                fontFamily: 'monospace', 
                                fontSize: '0.8rem',
                                wordBreak: 'break-all'
                              }}>
                                {selectedCertificateForView.txHash}
                              </span>
                            </div>
                          )}
                          
                          {selectedCertificateForView.ipfsHash && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>IPFS Hash: </span>
                              <span style={{ 
                                color: '#8b5cf6', 
                                fontFamily: 'monospace', 
                                fontSize: '0.8rem',
                                wordBreak: 'break-all'
                              }}>
                                {selectedCertificateForView.ipfsHash}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.05)',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        textAlign: 'center'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#8b5cf6', fontSize: '1rem' }}>
                          📱 Quick Verification
                        </h5>
                        
                        <button
                          onClick={() => downloadQRCode(selectedCertificateForView.id)}
                          style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#8b5cf6',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            width: '100%'
                          }}
                        >
                          📱 Download QR Code
                        </button>
                        
                        <p style={{
                          margin: '0.75rem 0 0 0',
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                          Share this QR code for instant certificate verification
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ ADD: Certificate Preview Modal with QR Code */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreviewModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div
              className="preview-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                width: '95%',
                maxWidth: '1400px',
                maxHeight: '95vh',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 32px 64px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Preview Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2rem 2rem 1rem 2rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1.75rem', 
                    color: 'white',
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}>
                    🖼️ Certificate Preview with QR Code
                  </h3>
                  {previewCertificate && (
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '1rem'
                    }}>
                      {previewCertificate.studentName} • {previewCertificate.degreeName}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {/* Download Preview Button */}
                  {previewCertificate && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = previewCertificate.previewURL
                        link.download = `preview-${previewCertificate.studentName.replace(/\s+/g, '-')}-certificate-with-qr.${previewCertificate.originalFileName.split('.').pop()}`
                        link.click()
                        
                        alert('📁 Preview certificate downloaded!')
                      }}
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <DocumentArrowDownIcon style={{ width: '1rem', height: '1rem' }} />
                      Download Preview
                    </button>
                  )}
                  
                  {/* Close Button */}
                  <button 
                    onClick={closePreviewModal}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: 'white',
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div style={{
                display: 'flex',
                height: 'calc(95vh - 140px)',
                maxHeight: '900px'
              }}>
                {/* Certificate with QR Code Preview */}
                <div style={{
                  flex: '3',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  {processingPreview ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2rem',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                          scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <SparklesIcon style={{ width: '4rem', height: '4rem', color: '#06b6d4' }} />
                      </motion.div>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                          🎨 Processing Certificate...
                        </h4>
                        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
                          Adding QR code and preparing preview
                        </p>
                      </div>
                    </div>
                  ) : previewCertificate ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '1rem'
                      }}>
                        {previewCertificate.originalFileName.toLowerCase().endsWith('.pdf') ? (
                          <iframe
                            src={previewCertificate.previewURL}
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              borderRadius: '12px'
                            }}
                            title="Certificate Preview"
                          />
                        ) : (
                          <img
                            src={previewCertificate.previewURL}
                            alt="Certificate with QR Code"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              borderRadius: '12px',
                              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Preview Actions */}
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#10b981',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>
                          <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                          QR Code Added Successfully
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#8b5cf6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>
                          <QrCodeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                          Ready for Blockchain
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                
                {/* Preview Details Panel */}
                <div style={{
                  flex: '1',
                  padding: '2rem',
                  overflowY: 'auto',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 1.5rem 0', 
                    color: 'white',
                    fontSize: '1.25rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingBottom: '0.75rem'
                  }}>
                    Preview Details
                  </h4>
                  
                  {previewCertificate && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Certificate Info */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#06b6d4', fontSize: '1rem' }}>
                          📋 Certificate Information
                        </h5>
                        
                        <div style={{ fontSize: '0.9rem' }}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Student: </span>
                            <span style={{ color: 'white', fontWeight: '600' }}>
                              {previewCertificate.studentName}
                            </span>
                          </div>
                          
                          <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Degree: </span>
                            <span style={{ color: 'white', fontWeight: '600' }}>
                              {previewCertificate.degreeName}
                            </span>
                          </div>
                          
                          <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Original File: </span>
                            <span style={{ color: 'white', fontWeight: '600' }}>
                              {previewCertificate.originalFileName}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* QR Code Details */}
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.05)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#8b5cf6', fontSize: '1rem' }}>
                          🔍 QR Code Details
                        </h5>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ 
                            margin: '0 0 0.5rem 0', 
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.85rem'
                          }}>
                            Verification URL:
                          </p>
                          <code style={{ 
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            color: '#8b5cf6',
                            fontSize: '0.75rem',
                            wordBreak: 'break-all',
                            display: 'block'
                          }}>
                            {previewCertificate.verificationURL}
                          </code>
                        </div>
                        
                        {previewQRCode && (
                          <div style={{ textAlign: 'center' }}>
                            <img
                              src={previewQRCode}
                              alt="Verification QR Code"
                              style={{
                                width: '120px',
                                height: '120px',
                                border: '2px solid rgba(139, 92, 246, 0.3)',
                                borderRadius: '8px',
                                background: 'white',
                                padding: '8px'
                              }}
                            />
                            <p style={{
                              margin: '0.75rem 0 0 0',
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                              Scan to verify certificate
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Next Steps */}
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.05)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#10b981', fontSize: '1rem' }}>
                          ✅ Next Steps
                        </h5>
                        
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                          <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                              Review the certificate with embedded QR code
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                              Close this preview and click "Issue Certificate"
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                              Certificate will be uploaded to IPFS
                            </li>
                            <li>
                              NFT will be minted on the blockchain
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ✅ Enhanced Certificate Viewer Modal */}
<AnimatePresence>
  {showCertificateModal && (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeCertificateModal} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)'
      }}
    >
      <motion.div
        className="certificate-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          width: '95%',
          maxWidth: '1400px',
          maxHeight: '95vh',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Enhanced Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))'
        }}>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.75rem', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              🎓 Certificate with QR Code
              {selectedCertificateForView?.hasQRCode || selectedCertificateForView?.enhancedCertificate ? (
                <span style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  ✅ QR Enhanced
                </span>
              ) : (
                <span style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  📄 Standard
                </span>
              )}
            </h3>
            {selectedCertificateForView && (
              <p style={{ 
                margin: '0.5rem 0 0 0', 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1rem'
              }}>
                {selectedCertificateForView.studentName} • {selectedCertificateForView.degreeName}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Enhanced Download Button */}
            {selectedCertificateForView && selectedCertificateForView.ipfsHash && (
              <button
                onClick={async () => {
                  try {
                    await certificateViewer.downloadCertificate(
                      selectedCertificateForView.ipfsHash,
                      selectedCertificateForView.id,
                      selectedCertificateForView.studentName
                    )
                    alert('📁 Certificate with QR code downloaded successfully!')
                  } catch (error) {
                    alert('❌ Download failed: ' + error.message)
                  }
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <DocumentArrowDownIcon style={{ width: '1rem', height: '1rem' }} />
                Download Certificate
              </button>
            )}
            
            {/* Share QR Code Button */}
            {selectedCertificateForView && (
              <button
                onClick={() => downloadQRCode(selectedCertificateForView.id)}
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#8b5cf6',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <QrCodeIcon style={{ width: '1rem', height: '1rem' }} />
                Get QR Code
              </button>
            )}
            
            {/* Close Button */}
            <button 
              onClick={closeCertificateModal}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.25rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Enhanced Modal Content */}
        <div style={{
          display: 'flex',
          height: 'calc(95vh - 140px)',
          maxHeight: '900px'
        }}>
          {/* Certificate Image Display with Enhanced QR Detection */}
          <div style={{
            flex: '2.5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {loadingCertificateImage ? (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    color: 'white',
    textAlign: 'center'
  }}>
    <motion.div
      animate={{ 
        rotate: [0, 360],
        scale: [1, 1.1, 1]
      }}
      transition={{ 
        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
        scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      <SparklesIcon style={{ width: '4rem', height: '4rem', color: '#8b5cf6' }} />
    </motion.div>
    <div>
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
        🎨 Enhancing Certificate...
      </h4>
      <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
        Loading certificate and adding QR code verification
      </p>
    </div>
  </div>
) : certificateImageUrl ? (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Certificate Image Container */}
                <div style={{
                  width: '100%',
                  height: '90%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '1rem',
                  position: 'relative'
                }}>
                  <img
                    src={certificateImageUrl}
                    alt="Certificate with QR Code"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  
                  {/* QR Code Indicator Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <QrCodeIcon style={{ width: '1rem', height: '1rem', color: '#8b5cf6' }} />
                    <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: '600' }}>
                      QR Embedded
                    </span>
                  </div>
                </div>
                
                {/* Certificate Status Footer */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  width: '100%',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#10b981',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Blockchain Verified
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#06b6d4',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    <DocumentTextIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    IPFS Stored
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#8b5cf6',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    <QrCodeIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    QR Ready
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center'
              }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <DocumentTextIcon style={{ width: '5rem', height: '5rem', color: 'rgba(255, 255, 255, 0.3)' }} />
                </motion.div>
                <div>
                  <h4 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.25rem' }}>
                    Certificate Not Available
                  </h4>
                  <p style={{ margin: '0.5rem 0', fontSize: '1rem', lineHeight: 1.5 }}>
                    This certificate was issued without an image file,<br />
                    or the file is not accessible from IPFS.
                  </p>
                  
                  {/* Alternative Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => downloadQRCode(selectedCertificateForView?.id)}
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#8b5cf6',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <QrCodeIcon style={{ width: '1rem', height: '1rem' }} />
                      Download QR Code
                    </button>
                    
                    <button
                      onClick={() => {
                        const verificationUrl = `${window.location.origin}/verify?id=${selectedCertificateForView?.id}`
                        navigator.clipboard.writeText(verificationUrl)
                        alert('🔗 Verification URL copied to clipboard!')
                      }}
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: '#06b6d4',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <LinkIcon style={{ width: '1rem', height: '1rem' }} />
                      Copy Verification Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Details Panel */}
          <div style={{
            flex: '1',
            padding: '2rem',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <h4 style={{ 
              margin: '0 0 1.5rem 0', 
              color: 'white',
              fontSize: '1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <InformationCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: '#06b6d4' }} />
              Certificate Details
            </h4>
            
            {selectedCertificateForView && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Student Information */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h5 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#06b6d4', 
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <UserIcon style={{ width: '1rem', height: '1rem' }} />
                    Student Information
                  </h5>
                  
                  <div style={{ fontSize: '0.9rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Name: </span>
                      <span style={{ color: 'white', fontWeight: '600' }}>
                        {selectedCertificateForView.studentName}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Degree: </span>
                      <span style={{ color: 'white', fontWeight: '600' }}>
                        {selectedCertificateForView.degreeName}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Issue Date: </span>
                      <span style={{ color: 'white', fontWeight: '600' }}>
                        {selectedCertificateForView.date}
                      </span>
                    </div>

                    {selectedCertificateForView.department && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Department: </span>
                        <span style={{ color: 'white', fontWeight: '600' }}>
                          {selectedCertificateForView.department}
                        </span>
                      </div>
                    )}

                    {selectedCertificateForView.gpa && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>GPA: </span>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>
                          {selectedCertificateForView.gpa}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Blockchain Information */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(6, 182, 212, 0.2)'
                }}>
                  <h5 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#06b6d4', 
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <CpuChipIcon style={{ width: '1rem', height: '1rem' }} />
                    Blockchain Details
                  </h5>
                  
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Token ID: </span>
                      <span style={{ color: 'white', fontFamily: 'monospace', background: 'rgba(0, 0, 0, 0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        #{selectedCertificateForView.id}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Status: </span>
                      <span style={{ 
                        color: selectedCertificateForView.status === 'issued' ? '#10b981' : '#ef4444',
                        textTransform: 'capitalize',
                        fontWeight: '600',
                        background: selectedCertificateForView.status === 'issued' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {selectedCertificateForView.status === 'issued' ? '✅ Active' : '❌ Revoked'}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Network: </span>
                      <span style={{ color: '#06b6d4', fontWeight: '600' }}>
                        Ethereum Sepolia
                      </span>
                    </div>
                    
                    {selectedCertificateForView.txHash && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Transaction: </span>
                        <code style={{ 
                          color: '#06b6d4', 
                          fontFamily: 'monospace', 
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          display: 'block',
                          marginTop: '0.25rem'
                        }}>
                          {selectedCertificateForView.txHash}
                        </code>
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>IPFS Hash: </span>
                      <code style={{ 
                        color: '#8b5cf6', 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        display: 'block',
                        marginTop: '0.25rem'
                      }}>
                        {selectedCertificateForView.ipfsHash}
                      </code>
                    </div>
                  </div>
                </div>
                
                {/* QR Code Information */}
                <div style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <h5 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#8b5cf6', 
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <QrCodeIcon style={{ width: '1rem', height: '1rem' }} />
                    QR Code Verification
                  </h5>
                  
                  <div style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                    <p style={{ 
                      margin: '0 0 1rem 0', 
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      This certificate includes an embedded QR code for instant verification.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button
                        onClick={() => downloadQRCode(selectedCertificateForView.id)}
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#8b5cf6',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <QrCodeIcon style={{ width: '1rem', height: '1rem' }} />
                        Download QR Code
                      </button>
                      
                      <button
                        onClick={() => {
                          const verificationUrl = `${window.location.origin}/verify?id=${selectedCertificateForView.id}`
                          navigator.clipboard.writeText(verificationUrl)
                          alert('🔗 Verification URL copied to clipboard!')
                        }}
                        style={{
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: '#06b6d4',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <LinkIcon style={{ width: '1rem', height: '1rem' }} />
                        Copy Verification URL
                      </button>
                    </div>
                    
                    <p style={{
                      margin: '1rem 0 0 0',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      lineHeight: 1.4
                    }}>
                      Share the QR code or verification URL for instant certificate authentication on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  )
}

export default AcademicInstitution
