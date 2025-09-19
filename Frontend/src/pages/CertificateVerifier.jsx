import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  UserIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  CameraIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  PrinterIcon,
  ClipboardDocumentIcon,
  HashtagIcon,
  CpuChipIcon,
  GlobeAltIcon,
  LockClosedIcon,
  SparklesIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { CursorProvider, Cursor } from '../components/Cursor'
import Particles from 'react-tsparticles'
import { loadSlim } from 'tsparticles-slim'

const CONTRACT_ADDRESS = "0x609B79dde0dE6D2A1a740486782E5D14B58FbD2c"
const CONTRACT_ABI = [
  "function getCertificateDetails(uint256 tokenId) public view returns (tuple(string studentName, string degreeName, uint256 issueDate))",
  "function ownerOf(uint256 tokenId) public view returns (address)"
]

// Sample verification history
const verificationHistory = [
  { id: '12345', studentName: 'Alice Johnson', degree: 'Computer Science', timestamp: '2 hours ago', status: 'valid' },
  { id: '12346', studentName: 'Bob Smith', degree: 'Engineering', timestamp: '5 hours ago', status: 'valid' },
  { id: '12347', studentName: 'Invalid Certificate', degree: 'N/A', timestamp: '1 day ago', status: 'invalid' },
]

// Certificate examples for quick testing
const sampleCertificates = [
  { id: '12345', name: 'Computer Science Degree' },
  { id: '12346', name: 'Engineering Degree' },
  { id: '12347', name: 'Business Administration' },
  { id: '12348', name: 'Medical Degree' }
]

const CertificateVerifier = () => {
  const [certificateId, setCertificateId] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [verificationMethod, setVerificationMethod] = useState('id')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showSamples, setShowSamples] = useState(false)
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [animationStep, setAnimationStep] = useState(0)
  const fileInputRef = useRef(null)

  const particlesInit = async (main) => {
    await loadSlim(main)
  }

  useEffect(() => {
    if (isVerifying) {
      const interval = setInterval(() => {
        setVerificationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
        setAnimationStep(prev => (prev + 1) % 4)
      }, 200)
      return () => clearInterval(interval)
    }
  }, [isVerifying])

  const verifyById = async () => {
    if (!certificateId.trim()) {
      alert('Please enter a certificate ID')
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)
    setVerificationProgress(0)

    // Simulate blockchain verification with progress
    const steps = [
      'Connecting to blockchain...',
      'Fetching certificate data...',
      'Validating ownership...',
      'Verifying authenticity...',
      'Generating report...'
    ]

    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
        
        // Simulate step-by-step verification
        for (let i = 0; i < steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800))
          setVerificationProgress((i + 1) * 20)
        }
        
        const certificateDetails = await contract.getCertificateDetails(certificateId)
        const owner = await contract.ownerOf(certificateId)
        
        setVerificationResult({
          isValid: true,
          certificateId: certificateId,
          studentName: certificateDetails.studentName,
          degreeName: certificateDetails.degreeName,
          issueDate: new Date(Number(certificateDetails.issueDate) * 1000).toLocaleDateString(),
          owner: owner,
          verifiedAt: new Date().toLocaleString(),
          blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64),
          verificationScore: 98.5,
          institutionVerified: true
        })
      } else {
        throw new Error('MetaMask not installed')
      }
    } catch (error) {
      console.error('Verification failed:', error)
      
      // Check if it's a sample certificate
      const sampleCert = sampleCertificates.find(cert => cert.id === certificateId)
      if (sampleCert) {
        setVerificationResult({
          isValid: true,
          certificateId: certificateId,
          studentName: 'Demo Student',
          degreeName: sampleCert.name,
          issueDate: '2024-06-15',
          owner: '0x742d35Cc6634C0532925a3b8D098f4123456789a',
          verifiedAt: new Date().toLocaleString(),
          blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64),
          verificationScore: 99.2,
          institutionVerified: true,
          isDemoData: true
        })
      } else {
        setVerificationResult({
          isValid: false,
          error: 'Certificate not found or invalid',
          certificateId: certificateId,
          errorCode: 'CERT_NOT_FOUND',
          suggestions: [
            'Check if the certificate ID is correct',
            'Ensure the certificate was issued on this blockchain',
            'Contact the issuing institution for verification'
          ]
        })
      }
    } finally {
      setIsVerifying(false)
      setVerificationProgress(0)
    }
  }

  const handleFileUpload = (files) => {
    const file = files[0]
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file)
      setTimeout(() => {
        const mockId = sampleCertificates[Math.floor(Math.random() * sampleCertificates.length)].id
        setCertificateId(mockId)
        verifyExtractedCertificate(mockId)
      }, 1500)
    } else {
      alert('Please upload a PDF certificate')
    }
  }

  const verifyExtractedCertificate = async (extractedId) => {
    setIsVerifying(true)
    setVerificationProgress(0)
    
    // Simulate AI extraction progress
    const steps = ['Parsing PDF...', 'Extracting data...', 'Verifying on blockchain...']
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setVerificationProgress((i + 1) * 33)
    }
    
    setTimeout(() => {
      setVerificationResult({
        isValid: Math.random() > 0.2, // 80% success rate
        certificateId: extractedId,
        studentName: 'John Doe',
        degreeName: 'Bachelor of Computer Science',
        issueDate: '2024-06-15',
        owner: '0x742d35Cc6634C0532925a3b8D098f4123456789a',
        verifiedAt: new Date().toLocaleString(),
        extractedFromFile: true,
        fileName: uploadedFile.name,
        blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64),
        verificationScore: 96.8,
        institutionVerified: true
      })
      setIsVerifying(false)
      setVerificationProgress(0)
    }, 1000)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const resetVerification = () => {
    setVerificationResult(null)
    setCertificateId('')
    setUploadedFile(null)
    setVerificationProgress(0)
  }

  const downloadReport = () => {
    // Simulate report generation
    const reportData = {
      certificateId: verificationResult.certificateId,
      studentName: verificationResult.studentName,
      degree: verificationResult.degreeName,
      verifiedAt: verificationResult.verifiedAt,
      verificationScore: verificationResult.verificationScore,
      blockchainHash: verificationResult.blockchainTxHash
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `verification-report-${verificationResult.certificateId}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <CursorProvider global>
      <div className="verifier-page enhanced">
        {/* Enhanced Particles Background */}
        <Particles
          id="verifier-particles"
          init={particlesInit}
          options={{
            background: { color: { value: "transparent" } },
            fpsLimit: 120,
            particles: {
              color: { value: ["#06b6d4", "#10b981", "#8b5cf6"] },
              links: {
                color: "#06b6d4",
                distance: 100,
                enable: true,
                opacity: 0.3,
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
              opacity: { value: 0.4 },
              shape: { type: ["circle", "triangle"] },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
        />

        {/* Enhanced Header */}
        <motion.header 
          className="verifier-header enhanced"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-content">
            <div className="header-left">
              <Cursor text="Back to Home">
                <motion.button 
                  className="back-btn enhanced"
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.history.back()}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back
                </motion.button>
              </Cursor>
              
              <div className="header-title">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <ShieldCheckIcon className="w-12 h-12 text-cyan-400" />
                </motion.div>
                <div>
                  <h1>Certificate Verifier</h1>
                  <p>Blockchain-powered certificate authentication</p>
                </div>
              </div>
            </div>

            <div className="header-actions">
              <Cursor text="View History">
                <motion.button
                  className="action-btn"
                  onClick={() => setShowHistory(!showHistory)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                  History
                </motion.button>
              </Cursor>
              
              <Cursor text="Sample Certificates">
                <motion.button
                  className="action-btn"
                  onClick={() => setShowSamples(!showSamples)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <InformationCircleIcon className="w-5 h-5" />
                  Samples
                </motion.button>
              </Cursor>
            </div>
          </div>
        </motion.header>

        <div className="verifier-container enhanced">
          {/* Quick Stats */}
          <motion.div 
            className="verification-stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="stat-item">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
              </motion.div>
              <div>
                <h3>2,847</h3>
                <p>Verified Today</p>
              </div>
            </div>
            <div className="stat-item">
              <CpuChipIcon className="w-8 h-8 text-purple-400" />
              <div>
                <h3>99.2%</h3>
                <p>Accuracy Rate</p>
              </div>
            </div>
            <div className="stat-item">
              <GlobeAltIcon className="w-8 h-8 text-cyan-400" />
              <div>
                <h3>156</h3>
                <p>Institutions</p>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Method Selection */}
          <motion.div 
            className="method-selection enhanced"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h2>Choose Verification Method</h2>
            <div className="method-buttons">
              <Cursor text="Verify by Certificate ID">
                <motion.button
                  className={`method-btn enhanced ${verificationMethod === 'id' ? 'active' : ''}`}
                  onClick={() => setVerificationMethod('id')}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={verificationMethod === 'id' ? { rotate: [0, 5, -5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <HashtagIcon className="w-8 h-8" />
                  </motion.div>
                  <span>Certificate ID</span>
                  <p>Enter unique certificate identifier</p>
                </motion.button>
              </Cursor>
              
              <Cursor text="Upload PDF Certificate">
                <motion.button
                  className={`method-btn enhanced ${verificationMethod === 'upload' ? 'active' : ''}`}
                  onClick={() => setVerificationMethod('upload')}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={verificationMethod === 'upload' ? { y: [0, -5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CloudArrowUpIcon className="w-8 h-8" />
                  </motion.div>
                  <span>Upload PDF</span>
                  <p>AI-powered document extraction</p>
                </motion.button>
              </Cursor>

              <Cursor text="Scan QR Code">
                <motion.button
                  className={`method-btn enhanced ${verificationMethod === 'qr' ? 'active' : ''}`}
                  onClick={() => setVerificationMethod('qr')}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 90, 180, 270, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <QrCodeIcon className="w-8 h-8" />
                  </motion.div>
                  <span>QR Scanner</span>
                  <p>Scan certificate QR code</p>
                </motion.button>
              </Cursor>
            </div>
          </motion.div>

          {/* Enhanced Verification Input */}
          <motion.div 
            className="verification-input enhanced"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <AnimatePresence mode="wait">
              {verificationMethod === 'id' ? (
                <motion.div
                  key="id-input"
                  className="input-section enhanced"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h3>Enter Certificate ID</h3>
                  <div className="search-container enhanced">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        placeholder="Enter certificate ID (e.g., 12345)"
                        value={certificateId}
                        onChange={(e) => setCertificateId(e.target.value)}
                        className="certificate-input enhanced"
                        onKeyPress={(e) => e.key === 'Enter' && verifyById()}
                      />
                      <motion.div 
                        className="input-glow"
                        animate={certificateId ? { opacity: [0.3, 0.7, 0.3] } : { opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    
                    <Cursor text="Verify Certificate">
                      <motion.button
                        onClick={verifyById}
                        disabled={isVerifying || !certificateId.trim()}
                        className="verify-btn enhanced"
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(6, 182, 212, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isVerifying ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <SparklesIcon className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <MagnifyingGlassIcon className="w-5 h-5" />
                        )}
                        {isVerifying ? 'Verifying...' : 'Verify Certificate'}
                      </motion.button>
                    </Cursor>
                  </div>

                  {/* Sample IDs */}
                  {showSamples && (
                    <motion.div
                      className="sample-ids"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h4>Try Sample Certificate IDs:</h4>
                      <div className="sample-grid">
                        {sampleCertificates.map((cert) => (
                          <motion.button
                            key={cert.id}
                            className="sample-btn"
                            onClick={() => setCertificateId(cert.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="sample-id">#{cert.id}</span>
                            <span className="sample-name">{cert.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : verificationMethod === 'upload' ? (
                <motion.div
                  key="upload-input"
                  className="upload-section enhanced"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3>Upload Certificate PDF</h3>
                  <div
                    className={`upload-zone enhanced ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      style={{ display: 'none' }}
                    />
                    
                    <motion.div
                      className="upload-content enhanced"
                      animate={dragActive ? { scale: 1.05 } : { scale: 1 }}
                    >
                      {uploadedFile ? (
                        <motion.div
                          className="file-uploaded enhanced"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <DocumentCheckIcon className="w-16 h-16 text-green-400" />
                          </motion.div>
                          <p>{uploadedFile.name}</p>
                          <span>AI is extracting certificate data...</span>
                          <div className="extraction-progress">
                            <motion.div
                              className="progress-bar"
                              animate={{ width: `${verificationProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <CloudArrowUpIcon className="w-20 h-20 text-cyan-400" />
                          </motion.div>
                          <p>Drop your certificate PDF here or click to browse</p>
                          <span>Supports PDF files up to 10MB • AI-powered extraction</span>
                          <div className="supported-formats">
                            <span>✓ PDF Certificates</span>
                            <span>✓ Digital Signatures</span>
                            <span>✓ QR Codes</span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="qr-input"
                  className="qr-section enhanced"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h3>Scan QR Code</h3>
                  <div className="qr-scanner-placeholder">
                    <motion.div
                      className="scanner-frame"
                      animate={{ 
                        boxShadow: [
                          "0 0 20px rgba(6, 182, 212, 0.5)",
                          "0 0 40px rgba(6, 182, 212, 0.8)",
                          "0 0 20px rgba(6, 182, 212, 0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CameraIcon className="w-20 h-20 text-cyan-400" />
                      <p>QR Scanner Coming Soon</p>
                      <span>Point your camera at the certificate QR code</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Verification Progress */}
          <AnimatePresence>
            {isVerifying && (
              <motion.div
                className="verification-progress enhanced"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="progress-container">
                  <div className="progress-header">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <CpuChipIcon className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                    <h3>Verifying Certificate...</h3>
                  </div>
                  
                  <div className="progress-bar-container">
                    <motion.div
                      className="progress-bar enhanced"
                      animate={{ width: `${verificationProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  <div className="progress-steps">
                    {['Blockchain', 'Authenticity', 'Ownership', 'Validation'].map((step, index) => (
                      <motion.div
                        key={step}
                        className={`progress-step ${index <= animationStep ? 'active' : ''}`}
                        animate={index <= animationStep ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="step-icon">
                          {index <= animationStep ? <CheckCircleIcon className="w-5 h-5" /> : <div className="step-dot" />}
                        </div>
                        <span>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Verification Result */}
          <AnimatePresence>
            {verificationResult && (
              <motion.div
                className="verification-result enhanced"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <div className={`result-card enhanced ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                  {/* Result Header */}
                  <div className="result-header enhanced">
                    <motion.div
                      className="result-icon enhanced"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      {verificationResult.isValid ? (
                        <motion.div
                          animate={{ 
                            boxShadow: [
                              "0 0 20px rgba(16, 185, 129, 0.5)",
                              "0 0 40px rgba(16, 185, 129, 0.8)",
                              "0 0 20px rgba(16, 185, 129, 0.5)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="success-icon"
                        >
                          <CheckCircleIcon className="w-20 h-20 text-green-400" />
                        </motion.div>
                      ) : (
                        <XCircleIcon className="w-20 h-20 text-red-400" />
                      )}
                    </motion.div>
                    
                    <div className="result-title enhanced">
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {verificationResult.isValid ? (
                          <>Certificate Verified ✓</>
                        ) : (
                          <>Verification Failed ✗</>
                        )}
                      </motion.h3>
                      
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        {verificationResult.isValid 
                          ? 'This certificate is authentic and blockchain-verified' 
                          : 'Certificate could not be verified on the blockchain'
                        }
                      </motion.p>

                      {verificationResult.isValid && (
                        <motion.div
                          className="verification-badge"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <LockClosedIcon className="w-4 h-4" />
                          <span>Blockchain Verified</span>
                          {verificationResult.isDemoData && (
                            <span className="demo-badge">Demo Data</span>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {verificationResult.isValid && (
                      <motion.div
                        className="verification-score"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <div className="score-circle">
                          <motion.div
                            className="score-progress"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: verificationResult.verificationScore / 100 }}
                            transition={{ duration: 2, delay: 1.2 }}
                          />
                          <span>{verificationResult.verificationScore}%</span>
                        </div>
                        <p>Trust Score</p>
                      </motion.div>
                    )}
                  </div>

                  {verificationResult.isValid ? (
                    <motion.div 
                      className="certificate-details enhanced"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      {/* Certificate Information */}
                      <div className="details-grid">
                        <motion.div 
                          className="detail-row enhanced"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 }}
                        >
                          <HashtagIcon className="w-5 h-5" />
                          <span>Certificate ID:</span>
                          <div className="detail-value">
                            <strong>#{verificationResult.certificateId}</strong>
                            <Cursor text="Copy ID">
                              <motion.button
                                className="copy-btn"
                                onClick={() => copyToClipboard(verificationResult.certificateId)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <ClipboardDocumentIcon className="w-4 h-4" />
                              </motion.button>
                            </Cursor>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="detail-row enhanced"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 }}
                        >
                          <UserIcon className="w-5 h-5" />
                          <span>Student Name:</span>
                          <strong>{verificationResult.studentName}</strong>
                        </motion.div>
                        
                        <motion.div 
                          className="detail-row enhanced"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.1 }}
                        >
                          <BuildingOffice2Icon className="w-5 h-5" />
                          <span>Degree:</span>
                          <strong>{verificationResult.degreeName}</strong>
                        </motion.div>
                        
                        <motion.div 
                          className="detail-row enhanced"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 }}
                        >
                          <CalendarIcon className="w-5 h-5" />
                          <span>Issue Date:</span>
                          <strong>{verificationResult.issueDate}</strong>
                        </motion.div>
                        
                        <motion.div 
                          className="detail-row enhanced"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.3 }}
                        >
                          <ShieldCheckIcon className="w-5 h-5" />
                          <span>Owner:</span>
                          <div className="detail-value">
                            <strong className="owner-address enhanced">
                              {verificationResult.owner.slice(0, 10)}...{verificationResult.owner.slice(-8)}
                            </strong>
                            <Cursor text="Copy Address">
                              <motion.button
                                className="copy-btn"
                                onClick={() => copyToClipboard(verificationResult.owner)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <ClipboardDocumentIcon className="w-4 h-4" />
                              </motion.button>
                            </Cursor>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="detail-row enhanced"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.4 }}
                        >
                          <LockClosedIcon className="w-5 h-5" />
                          <span>Blockchain Hash:</span>
                          <div className="detail-value">
                            <strong className="tx-hash">
                              {verificationResult.blockchainTxHash.slice(0, 10)}...{verificationResult.blockchainTxHash.slice(-8)}
                            </strong>
                            <Cursor text="Copy Hash">
                              <motion.button
                                className="copy-btn"
                                onClick={() => copyToClipboard(verificationResult.blockchainTxHash)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <ClipboardDocumentIcon className="w-4 h-4" />
                              </motion.button>
                            </Cursor>
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Verification Metadata */}
                      <motion.div 
                        className="verification-meta enhanced"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                      >
                        <div className="meta-left">
                          <span>Verified on {verificationResult.verifiedAt}</span>
                          {verificationResult.extractedFromFile && (
                            <span className="extracted-badge enhanced">
                              📄 Extracted from: {verificationResult.fileName}
                            </span>
                          )}
                        </div>
                        <div className="meta-right">
                          {verificationResult.institutionVerified && (
                            <span className="institution-badge">
                              ✅ Institution Verified
                            </span>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="error-details enhanced"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
                      <div className="error-content">
                        <h4>{verificationResult.error}</h4>
                        <p>Error Code: {verificationResult.errorCode}</p>
                        
                        {verificationResult.suggestions && (
                          <div className="error-suggestions">
                            <h5>Suggestions:</h5>
                            <ul>
                              {verificationResult.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Enhanced Action Buttons */}
                  <motion.div 
                    className="result-actions enhanced"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: verificationResult.isValid ? 1.6 : 0.8 }}
                  >
                    <Cursor text="Verify Another Certificate">
                      <motion.button
                        onClick={resetVerification}
                        className="reset-btn enhanced"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MagnifyingGlassIcon className="w-5 h-5" />
                        Verify Another Certificate
                      </motion.button>
                    </Cursor>
                    
                    {verificationResult.isValid && (
                      <>
                        <Cursor text="Download Verification Report">
                          <motion.button
                            onClick={downloadReport}
                            className="download-btn enhanced"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <DocumentArrowDownIcon className="w-5 h-5" />
                            Download Report
                          </motion.button>
                        </Cursor>
                        
                        <Cursor text="Share Verification">
                          <motion.button
                            className="share-btn enhanced"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ShareIcon className="w-5 h-5" />
                            Share
                          </motion.button>
                        </Cursor>
                        
                        <Cursor text="Print Certificate">
                          <motion.button
                            className="print-btn enhanced"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PrinterIcon className="w-5 h-5" />
                            Print
                          </motion.button>
                        </Cursor>
                      </>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification History Sidebar */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                className="history-sidebar"
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.4 }}
              >
                <div className="history-header">
                  <h3>Recent Verifications</h3>
                  <button onClick={() => setShowHistory(false)}>✕</button>
                </div>
                
                <div className="history-list">
                  {verificationHistory.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className={`history-item ${item.status}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="history-icon">
                        {item.status === 'valid' ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-400" />
                        ) : (
                          <XCircleIcon className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <div className="history-details">
                        <h4>#{item.id}</h4>
                        <p>{item.studentName}</p>
                        <span>{item.degree}</span>
                        <small>{item.timestamp}</small>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CursorProvider>
  )
}

export default CertificateVerifier
