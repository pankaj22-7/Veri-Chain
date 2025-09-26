import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import Particles from 'react-tsparticles'
import { loadSlim } from 'tsparticles-slim'
import { useInView } from 'react-intersection-observer'
import { 
  ShieldCheckIcon, BuildingOffice2Icon, UserIcon, 
  SparklesIcon, CheckCircleIcon, BoltIcon, 
  EyeIcon, LockClosedIcon, GlobeAltIcon,
  ArrowRightIcon, StarIcon, ChartBarIcon,
  CpuChipIcon, RocketLaunchIcon, FireIcon
} from '@heroicons/react/24/outline'
import { CursorProvider, Cursor } from './components/Cursor'
import CertificateVerifier from './pages/CertificateVerifier'
import AcademicInstitution from './pages/AcademicInstitution'
import CertificateHolder from './pages/CertificateHolder'
import './App.css'

const CONTRACT_ADDRESS = "0x609B79dde0dE6D2A1a740486782E5D14B58FbD2c"

const userTypes = [
  {
    id: 'verifier',
    title: 'Certificate Verifier',
    subtitle: 'Instant Authentication',
    description: 'Verify any certificate authenticity in real-time using blockchain technology',
    icon: ShieldCheckIcon,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    stats: '99.9% Accuracy',
    color: '#10b981',
    route: '/verifier'
  },
  {
    id: 'issuer',
    title: 'Academic Institution',
    subtitle: 'Digital Certificate Issuer',
    description: 'Issue tamper-proof NFT certificates that students own forever',
    icon: BuildingOffice2Icon,
    gradient: 'from-blue-400 via-purple-500 to-indigo-600',
    stats: 'Unlimited Issuance',
    color: '#3b82f6',
    route: '/issuer'
  },
  {
    id: 'student',
    title: 'Certificate Holder',
    subtitle: 'Own Your Achievements',
    description: 'Access, share, and prove your credentials anywhere in the world',
    icon: UserIcon,
    gradient: 'from-orange-400 via-pink-500 to-red-600',
    stats: 'Lifetime Access',
    color: '#f59e0b',
    route: '/student'
  }
]

const liveStats = [
  { label: "Certificates Issued", value: "12,847", trend: "+15.2%" },
  { label: "Institutions Active", value: "342", trend: "+8.7%" },
  { label: "Verifications Today", value: "1,923", trend: "+23.1%" },
  { label: "Global Reach", value: "89 Countries", trend: "+12%" }
]

function HomePage() {
  const [account, setAccount] = useState('')
  const [selectedUserType, setSelectedUserType] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentStat, setCurrentStat] = useState(0)
  const [showStats, setShowStats] = useState(false)

  const navigate = useNavigate()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const rotateX = useTransform(mouseY, [0, 800], [5, -5])
  const rotateY = useTransform(mouseX, [0, 1200], [-5, 5])

  const { ref: heroRef, inView: heroInView } = useInView({ threshold: 0.3 })
  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.5 })

  useEffect(() => {
    setMounted(true)
    
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      setMousePosition({ x: clientX, y: clientY })
      mouseX.set(clientX)
      mouseY.set(clientY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % liveStats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (statsInView) {
      setShowStats(true)
    }
  }, [statsInView])

  const particlesInit = async (main) => {
    await loadSlim(main)
  }

  const connectWallet = async () => {
    if (window.ethereum) {
      setIsConnecting(true)
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        setAccount(address)
      } catch (error) {
        console.error("❌ Connection failed:", error)
      } finally {
        setIsConnecting(false)
      }
    } else {
      alert("Please install MetaMask!")
    }
  }

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType.id)
    
    // Add a small delay for the animation to show
    setTimeout(() => {
      navigate(userType.route)
    }, 300)
  }

  const scrollToUserTypes = () => {
    document.querySelector('.user-types-section').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  if (!mounted) return null

  return (
    <div className="app futuristic">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 120,
          particles: {
            color: { value: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"] },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.1,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: { default: "bounce" },
              random: true,
              speed: 1.5,
              straight: false,
            },
            number: { density: { enable: true, area: 800 }, value: 80 },
            opacity: { 
              value: { min: 0.2, max: 0.6 },
              animation: {
                enable: true,
                speed: 1,
                minimumValue: 0.1
              }
            },
            shape: { type: ["circle", "triangle", "polygon"] },
            size: { 
              value: { min: 1, max: 5 },
              animation: {
                enable: true,
                speed: 2,
                minimumValue: 1
              }
            },
          },
          detectRetina: true,
        }}
      />

      <motion.div 
        className="dynamic-gradient"
        animate={{
          background: [
            `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15) 0%, transparent 50%)`,
            `radial-gradient(circle at ${mousePosition.x + 100}px ${mousePosition.y + 100}px, rgba(139, 92, 246, 0.15) 0%, transparent 50%)`,
            `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(236, 72, 153, 0.15) 0%, transparent 50%)`
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.nav 
        className="nav advanced"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Cursor text="VeriChain">
          <motion.div className="nav-brand" onClick={() => navigate('/')}>
            <div className="logo futuristic">
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ShieldCheckIcon className="logo-icon" />
              </motion.div>
              <div className="logo-text-container">
                <span className="logo-text">VeriChain</span>
                <motion.div 
                  className="logo-subtitle"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  BLOCKCHAIN VERIFIED
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Cursor>
        
        <div className="nav-actions">
          {/* Quick Links */}
          <div className="nav-links">
            <Cursor text="Verify Certificate">
              <motion.button 
                onClick={() => navigate('/verifier')}
                className="nav-link"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                Verify
              </motion.button>
            </Cursor>
          </div>

          {!account ? (
            <Cursor text="Connect Wallet">
              <motion.button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="connect-btn futuristic"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)",
                  y: -2
                }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isConnecting ? (
                    <motion.div
                      key="loading"
                      className="loading-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <SparklesIcon className="w-5 h-5" />
                      </motion.div>
                      <span>Connecting...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="connect"
                      className="btn-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <BoltIcon className="w-5 h-5" />
                      <span>Connect Wallet</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </Cursor>
          ) : (
            <Cursor text="Wallet Connected">
              <motion.div 
                className="wallet-info futuristic"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    boxShadow: [
                      "0 0 10px rgba(16, 185, 129, 0.5)",
                      "0 0 20px rgba(16, 185, 129, 0.8)",
                      "0 0 10px rgba(16, 185, 129, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                </motion.div>
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </motion.div>
            </Cursor>
          )}
        </div>
      </motion.nav>

      <main className="main">
        <motion.section 
          ref={heroRef}
          className="hero-section futuristic"
          style={{ rotateX, rotateY }}
        >
          <div className="floating-shapes">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="floating-shape"
                animate={{
                  y: [0, -30, 0],
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 2) * 40}%`
                }}
              >
                {[
                  <StarIcon className="w-8 h-8" />,
                  <RocketLaunchIcon className="w-8 h-8" />,
                  <FireIcon className="w-8 h-8" />,
                  <CpuChipIcon className="w-8 h-8" />,
                  <BoltIcon className="w-8 h-8" />,
                  <SparklesIcon className="w-8 h-8" />
                ][i]}
              </motion.div>
            ))}
          </div>

          <motion.div
            className="hero-content"
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 1 }}
          >
            <motion.h1 className="hero-title futuristic">
              <motion.div className="title-line">
                <motion.span
                  className="title-word"
                  initial={{ x: -200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 1, type: "spring" }}
                >
                  Revolutionary
                </motion.span>
              </motion.div>
              <motion.div className="title-line">
                <motion.span
                  className="title-word gradient-text"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1, type: "spring" }}
                >
                  Degree
                </motion.span>
              </motion.div>
              
              <motion.div className="title-line">
                <motion.span
                  className="title-word gradient-text"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1, type: "spring" }}
                >
                  Certificate
                </motion.span>
              </motion.div>
              
              <motion.div className="title-line">
                <motion.span
                  className="title-word"
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 1, type: "spring" }}
                >
                  Verification
                </motion.span>
                <motion.div
                  className="title-decoration"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ✨
                </motion.div>
              </motion.div>
            </motion.h1>

            <motion.p
              className="hero-subtitle futuristic"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              Experience the future of academic credentials with 
              <motion.span
                className="highlight-text"
                animate={{
                  color: ["#06b6d4", "#8b5cf6", "#ec4899", "#06b6d4"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {' '}blockchain technology
              </motion.span>
            </motion.p>

            <motion.div
              className="hero-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <Cursor text="Get Started">
                <motion.button
                  className="cta-primary"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={scrollToUserTypes}
                >
                  <RocketLaunchIcon className="w-5 h-5" />
                  Get Started
                </motion.button>
              </Cursor>
              
              <Cursor text="View Demo">
                <motion.button
                  className="cta-secondary"
                  whileHover={{ scale: 1.05, y: -2 }}
                  onClick={() => navigate('/verifier')}
                >
                  <EyeIcon className="w-5 h-5" />
                  View Demo
                </motion.button>
              </Cursor>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.div
          ref={statsRef}
          className="live-stats-section"
          initial={{ opacity: 0, y: 50 }}
          animate={showStats ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          <div className="stats-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStat}
                className="stat-display"
                initial={{ opacity: 0, rotateX: 90 }}
                animate={{ opacity: 1, rotateX: 0 }}
                exit={{ opacity: 0, rotateX: -90 }}
                transition={{ duration: 0.5 }}
              >
                <ChartBarIcon className="w-10 h-10" />
                <div className="stat-content">
                  <motion.h3
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {liveStats[currentStat].value}
                  </motion.h3>
                  <p>{liveStats[currentStat].label}</p>
                  <span className="stat-trend">{liveStats[currentStat].trend}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.section className="user-types-section futuristic">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            viewport={{ once: true }}
          >
            Choose Your Journey
          </motion.h2>
          
          <div className="user-types-grid">
            {userTypes.map((userType, index) => (
              <Cursor key={userType.id} text={`Go to ${userType.title}`}>
                <motion.div
                  className={`user-type-card futuristic ${selectedUserType === userType.id ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.2, 
                    duration: 0.8,
                    type: "spring"
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  onClick={() => handleUserTypeSelect(userType)}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="card-bg-glow"
                    animate={{
                      background: [
                        `linear-gradient(45deg, ${userType.color}10, transparent)`,
                        `linear-gradient(135deg, ${userType.color}20, transparent)`,
                        `linear-gradient(225deg, ${userType.color}15, transparent)`,
                        `linear-gradient(315deg, ${userType.color}25, transparent)`,
                        `linear-gradient(45deg, ${userType.color}10, transparent)`
                      ]
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                  />

                  <motion.div 
                    className={`icon-container bg-gradient-to-br ${userType.gradient}`}
                    animate={{
                      y: [-2, 2, -2],
                      rotateZ: [-1, 1, -1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    whileHover={{
                      scale: 1.1,
                      rotateZ: 5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <userType.icon className="w-12 h-12 text-white" />
                    
                    <motion.div
                      className="icon-pulse"
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.3, 0, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>

                  <div className="card-content">
                    <h3 className="card-title">{userType.title}</h3>
                    <p className="card-subtitle">{userType.subtitle}</p>
                    <p className="card-description">{userType.description}</p>
                    
                    <motion.div 
                      className="stats-badge"
                      whileHover={{ scale: 1.05 }}
                    >
                      {userType.stats}
                    </motion.div>
                  </div>

                  <motion.div 
                    className="card-arrow"
                    animate={{
                      x: selectedUserType === userType.id ? 5 : 0,
                      opacity: selectedUserType === userType.id ? 1 : 0.6
                    }}
                    whileHover={{ x: 3, scale: 1.1 }}
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </motion.div>
                </motion.div>
              </Cursor>
            ))}
          </div>
        </motion.section>

        <motion.div
          className="contract-info futuristic"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="contract-details">
            <Cursor text="Copy Address">
              <motion.div 
                className="contract-item"
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)}
              >
                <LockClosedIcon className="w-5 h-5" />
                <span className="label">Contract:</span>
                <code className="address">{CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}</code>
              </motion.div>
            </Cursor>
            
            <Cursor text="Ethereum Network">
              <motion.div 
                className="contract-item"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <GlobeAltIcon className="w-5 h-5" />
                <span className="label">Network:</span>
                <span className="network">Ethereum Sepolia</span>
              </motion.div>
            </Cursor>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

// Coming Soon components for placeholder routes
const ComingSoon = ({ title }) => (
  <div className="coming-soon">
    <div className="coming-soon-content">
      <h1>{title}</h1>
      <p>Coming Soon...</p>
      <motion.button
        className="back-home-btn"
        onClick={() => window.location.href = '/'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Back to Home
      </motion.button>
    </div>
  </div>
)

// Main App component with Router
function App() {
  return (
    <CursorProvider global>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/verifier" element={<CertificateVerifier />} />
          <Route path="/verify" element={<CertificateVerifier />} />
          <Route path="/issuer" element={<AcademicInstitution />} />
          <Route path="/student" element={<CertificateHolder/>} />
        </Routes>
      </Router>
    </CursorProvider>
  )
}

export default App
