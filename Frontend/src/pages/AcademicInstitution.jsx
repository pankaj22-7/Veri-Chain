import { useState, useRef } from 'react'
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
  SparklesIcon
} from '@heroicons/react/24/outline'

const CONTRACT_ADDRESS = "0x609B79dde0dE6D2A1a740486782E5D14B58FbD2c"

// Mock data
const institutionData = {
  name: "VeriTech University",
  address: "123 Blockchain Ave, Crypto City", 
  phone: "+1 (555) 123-4567",
  email: "admin@veritech.edu",
  website: "www.veritech.edu",
  established: "1985",
  certificatesIssued: "12,847"
}

const initialCertificates = [
  { id: '12345', studentName: 'Alice Johnson', degree: 'Computer Science', date: '2024-09-15', status: 'issued', department: 'Engineering', gpa: '3.85' },
  { id: '12346', studentName: 'Bob Smith', degree: 'Data Science', date: '2024-09-14', status: 'pending', department: 'Engineering', gpa: '3.92' },
  { id: '12347', studentName: 'Carol Brown', degree: 'AI Engineering', date: '2024-09-13', status: 'issued', department: 'Engineering', gpa: '3.78' },
  { id: '12348', studentName: 'David Wilson', degree: 'Blockchain Dev', date: '2024-09-12', status: 'draft', department: 'Engineering', gpa: '3.65' },
  { id: '12349', studentName: 'Emma Davis', degree: 'Cybersecurity', date: '2024-09-11', status: 'issued', department: 'Engineering', gpa: '3.91' }
]

const analytics = {
  totalIssued: 12847,
  thisMonth: 245, 
  pending: 12,
  verified: 12835,
  departments: [
    { name: 'Computer Science', count: 4250, percentage: 33 },
    { name: 'Engineering', count: 3200, percentage: 25 },
    { name: 'Business', count: 2500, percentage: 19 },
    { name: 'Medicine', count: 1897, percentage: 15 },
    { name: 'Arts', count: 1000, percentage: 8 }
  ],
  monthlyData: [
    { month: 'Jan', certificates: 850 },
    { month: 'Feb', certificates: 920 },
    { month: 'Mar', certificates: 1100 },
    { month: 'Apr', certificates: 980 },
    { month: 'May', certificates: 1200 },
    { month: 'Jun', certificates: 1350 },
    { month: 'Jul', certificates: 1180 },
    { month: 'Aug', certificates: 1420 },
    { month: 'Sep', certificates: 245 }
  ]
}

const AcademicInstitution = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [account, setAccount] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [certificates, setCertificates] = useState(initialCertificates)
  const [searchTerm, setSearchTerm] = useState('')
  const [isIssuing, setIsIssuing] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [bulkUpload, setBulkUpload] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCertDetails, setShowCertDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [institutionSettings, setInstitutionSettings] = useState(institutionData)
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const fileInputRef = useRef(null)

  // Form state
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentWallet: '',
    degreeName: '',
    department: '',
    graduationDate: '',
    gpa: '',
    honors: ''
  })

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        setAccount(address)
        setIsConnected(true)
      } catch (error) {
        console.error("Connection failed:", error)
      }
    } else {
      alert("Please install MetaMask!")
    }
  }

  const issueCertificate = async () => {
    if (!formData.studentName || !formData.degreeName || !formData.studentWallet) {
      alert('Please fill in all required fields')
      return
    }

    setIsIssuing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      const newCertificate = {
        id: Math.floor(Math.random() * 100000).toString(),
        studentName: formData.studentName,
        degree: formData.degreeName,
        date: new Date().toISOString().split('T')[0],
        status: 'issued',
        department: formData.department,
        gpa: formData.gpa,
        honors: formData.honors,
        txHash: '0x' + Math.random().toString(16).substr(2, 64)
      }

      setCertificates(prev => [newCertificate, ...prev])
      setFormData({
        studentName: '',
        studentEmail: '',
        studentWallet: '',
        degreeName: '',
        department: '',
        graduationDate: '',
        gpa: '',
        honors: ''
      })

      alert(`Certificate #${newCertificate.id} issued successfully!`)
    } catch (error) {
      console.error('Issuance failed:', error)
      alert('Certificate issuance failed. Please try again.')
    } finally {
      setIsIssuing(false)
    }
  }

  const handleViewCertificate = (cert) => {
    setSelectedCertificate(cert)
    setShowCertDetails(true)
  }

  const handleEditCertificate = (cert) => {
    setFormData({
      studentName: cert.studentName,
      studentEmail: cert.studentEmail || '',
      studentWallet: '0x742d35Cc6634C0532925a3b8D098f4123456789a',
      degreeName: cert.degree,
      department: cert.department || '',
      graduationDate: cert.date,
      gpa: cert.gpa || '',
      honors: cert.honors || ''
    })
    setActiveTab('issue')
  }

  const handleDeleteCertificate = (cert) => {
    setSelectedCertificate(cert)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    setCertificates(prev => prev.filter(cert => cert.id !== selectedCertificate.id))
    setShowDeleteConfirm(false)
    setSelectedCertificate(null)
    alert(`Certificate #${selectedCertificate.id} has been deleted.`)
  }

  const handlePreview = () => {
    if (!formData.studentName || !formData.degreeName) {
      alert('Please fill in student name and degree name to preview')
      return
    }
    setShowPreview(true)
  }

  const updateSettings = () => {
    setIsEditingSettings(false)
    alert('Institution settings updated successfully!')
  }

  const handleBulkUpload = (files) => {
    const file = files[0]
    if (file && file.type === 'text/csv') {
      setTimeout(() => {
        alert(`Processing ${file.name}... This will issue certificates in batch.`)
        setBulkUpload(false)
      }, 1000)
    } else {
      alert('Please upload a CSV file')
    }
  }

  const filteredCertificates = certificates.filter(cert =>
    cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.id.includes(searchTerm)
  )

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'issue', label: 'Issue Certificate', icon: DocumentPlusIcon },
    { id: 'manage', label: 'Manage Certificates', icon: ClipboardDocumentListIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ]

  return (
    <div className="institution-page">
      {/* Header */}
      <header className="institution-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="back-btn"
              onClick={() => window.history.back()}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
            
            <div className="header-title">
              <BuildingOffice2Icon className="w-12 h-12 text-blue-400" />
              <div>
                <h1>Academic Institution</h1>
                <p>Certificate Issuance & Management Portal</p>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="institution-info">
              <h3>{institutionSettings.name}</h3>
              <p>{institutionSettings.certificatesIssued} certificates issued</p>
            </div>

            {!isConnected ? (
              <button className="connect-wallet-btn" onClick={connectWallet}>
                <LockClosedIcon className="w-5 h-5" />
                Connect Wallet
              </button>
            ) : (
              <div className="wallet-connected">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="institution-container">
        {/* Navigation Tabs */}
        <nav className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <div className="dashboard-main-grid">
              {/* Stats Cards */}
              <div className="dashboard-stats-container">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon total-icon">
                    <DocumentTextIcon className="w-8 h-8" />
                  </div>
                  <div className="dashboard-stat-content">
                    <h3>{analytics.totalIssued.toLocaleString()}</h3>
                    <p>Total Certificates</p>
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon month-icon">
                    <CalendarDaysIcon className="w-8 h-8" />
                  </div>
                  <div className="dashboard-stat-content">
                    <h3>{analytics.thisMonth}</h3>
                    <p>This Month</p>
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon pending-icon">
                    <SparklesIcon className="w-8 h-8" />
                  </div>
                  <div className="dashboard-stat-content">
                    <h3>{analytics.pending}</h3>
                    <p>Pending</p>
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon verified-icon">
                    <ShieldCheckIcon className="w-8 h-8" />
                  </div>
                  <div className="dashboard-stat-content">
                    <h3>{analytics.verified.toLocaleString()}</h3>
                    <p>Verified</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-quick-actions">
                <h3>Quick Actions</h3>
                <div className="dashboard-action-buttons">
                  <button
                    className="dashboard-action-btn primary-action"
                    onClick={() => setActiveTab('issue')}
                  >
                    <PlusIcon className="w-5 h-5" />
                    Issue Certificate
                  </button>

                  <button
                    className="dashboard-action-btn secondary-action"
                    onClick={() => setBulkUpload(true)}
                  >
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Bulk Upload
                  </button>

                  <button
                    className="dashboard-action-btn tertiary-action"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    View Analytics
                  </button>
                </div>
              </div>

              {/* Recent Certificates */}
              <div className="dashboard-recent-certificates">
                <div className="dashboard-section-header">
                  <h3>Recent Certificates</h3>
                  <button 
                    className="dashboard-view-all-btn"
                    onClick={() => setActiveTab('manage')}
                  >
                    View All
                  </button>
                </div>
                
                <div className="dashboard-certificates-list">
                  {initialCertificates.slice(0, 5).map((cert) => (
                    <div key={cert.id} className="dashboard-certificate-item">
                      <div className="dashboard-cert-info">
                        <h4>#{cert.id}</h4>
                        <p>{cert.studentName}</p>
                        <span>{cert.degree}</span>
                      </div>
                      <div className="dashboard-cert-meta">
                        <span className="dashboard-cert-date">{cert.date}</span>
                        <span className={`dashboard-cert-status ${cert.status}`}>
                          {cert.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Distribution */}
              <div className="dashboard-department-chart">
                <h3>Certificates by Department</h3>
                <div className="dashboard-dept-chart-container">
                  {analytics.departments.map((dept, index) => (
                    <div key={dept.name} className="dashboard-dept-bar">
                      <div className="dashboard-dept-label">
                        <span>{dept.name}</span>
                        <span>{dept.count.toLocaleString()}</span>
                      </div>
                      <div className="dashboard-bar-container">
                        <div
                          className="dashboard-bar-fill"
                          style={{ 
                            width: `${dept.percentage}%`,
                            backgroundColor: `hsl(${index * 60 + 200}, 70%, 60%)`
                          }}
                        />
                      </div>
                      <span className="dashboard-dept-percentage">{dept.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'issue' && (
          <div className="tab-content">
            <div className="issue-certificate-form-fixed">
              <div className="form-header">
                <h2>Issue New Certificate</h2>
                <p>Create a blockchain-verified digital certificate</p>
              </div>

              <div className="form-container">
                <div className="form-section">
                  <h3>Student Information</h3>
                  <div className="form-fields">
                    <div className="field-group">
                      <div className="form-field">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          placeholder="Enter student's full name"
                          value={formData.studentName}
                          onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                        />
                      </div>
                      <div className="form-field">
                        <label>Email Address</label>
                        <input
                          type="email"
                          placeholder="student@university.edu"
                          value={formData.studentEmail}
                          onChange={(e) => setFormData({...formData, studentEmail: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label>Wallet Address *</label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={formData.studentWallet}
                        onChange={(e) => setFormData({...formData, studentWallet: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Academic Details</h3>
                  <div className="form-fields">
                    <div className="field-group">
                      <div className="form-field">
                        <label>Degree/Program *</label>
                        <input
                          type="text"
                          placeholder="e.g., Bachelor of Computer Science"
                          value={formData.degreeName}
                          onChange={(e) => setFormData({...formData, degreeName: e.target.value})}
                        />
                      </div>
                      <div className="form-field">
                        <label>Department</label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                        >
                          <option value="">Select Department</option>
                          <option value="computer-science">Computer Science</option>
                          <option value="engineering">Engineering</option>
                          <option value="business">Business</option>
                          <option value="medicine">Medicine</option>
                          <option value="arts">Arts</option>
                        </select>
                      </div>
                    </div>
                    <div className="field-group">
                      <div className="form-field">
                        <label>Graduation Date</label>
                        <input
                          type="date"
                          value={formData.graduationDate}
                          onChange={(e) => setFormData({...formData, graduationDate: e.target.value})}
                        />
                      </div>
                      <div className="form-field">
                        <label>GPA (optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          placeholder="3.85"
                          value={formData.gpa}
                          onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label>Honors/Distinctions</label>
                      <select
                        value={formData.honors}
                        onChange={(e) => setFormData({...formData, honors: e.target.value})}
                      >
                        <option value="">None</option>
                        <option value="summa-cum-laude">Summa Cum Laude</option>
                        <option value="magna-cum-laude">Magna Cum Laude</option>
                        <option value="cum-laude">Cum Laude</option>
                        <option value="with-distinction">With Distinction</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="issue-btn"
                  onClick={issueCertificate}
                  disabled={isIssuing || !isConnected}
                >
                  {isIssuing ? (
                    <SparklesIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <DocumentCheckIcon className="w-5 h-5" />
                  )}
                  {isIssuing ? 'Issuing Certificate...' : 'Issue Certificate'}
                </button>

                <button className="preview-btn" onClick={handlePreview}>
                  <EyeIcon className="w-5 h-5" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="tab-content">
            <div className="manage-certificates">
              <div className="manage-header">
                <h2>Certificate Management</h2>
                <div className="search-container">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="certificates-table">
                <div className="table-header">
                  <span>Certificate ID</span>
                  <span>Student Name</span>
                  <span>Degree</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                
                <div className="table-body">
                  {filteredCertificates.map((cert) => (
                    <div key={cert.id} className="table-row">
                      <span className="cert-id">#{cert.id}</span>
                      <span className="student-name">{cert.studentName}</span>
                      <span className="degree">{cert.degree}</span>
                      <span className="date">{cert.date}</span>
                      <span className={`status ${cert.status}`}>
                        {cert.status}
                      </span>
                      <div className="actions">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewCertificate(cert)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditCertificate(cert)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteCertificate(cert)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'analytics' && (
          <div className="tab-content">
            <div className="analytics-dashboard">
              <h2>Analytics & Reports</h2>
              <div className="analytics-grid">
                
            {/* Card 1: Monthly Chart */}
        <div className="analytics-card">
          <h3>Monthly Issuance Trend</h3>
          <div className="chart-container">
            {analytics.monthlyData.map((data, index) => (
              <div key={data.month} className="bar-chart-item">
                <div className="bar-value">{data.certificates}</div>
                <div 
                  className="bar" 
                  style={{ 
                    height: `${Math.max((data.certificates / 1500) * 160, 20)}px`,
                    backgroundColor: `hsl(${200 + index * 20}, 70%, 60%)`
                  }}
                />
                <div className="bar-label">{data.month}</div>
              </div>
            ))}
          </div>
        </div>

                
                {/* Card 2: Department Distribution */}
             <div className="analytics-card">
  <h3>Department Distribution</h3>
  <div className="pie-chart-container">
    {analytics.departments.map((dept, index) => (
      <div key={dept.name} className="pie-item-enhanced">
        <div 
          className="pie-color" 
          style={{ 
            backgroundColor: `hsl(${index * 72}, 70%, 60%)`,
            '--item-color': `hsl(${index * 72}, 70%, 60%)`
          }} 
        />
        <div className="dept-info">
          <div className="dept-name">
            <span>{dept.name}</span>
            <span className="dept-count">{dept.count.toLocaleString()}</span>
          </div>
          <div className="dept-progress">
            <div 
              className="dept-progress-fill"
              style={{ 
                width: `${dept.percentage}%`,
                backgroundColor: `hsl(${index * 72}, 70%, 60%)`,
                color: `hsl(${index * 72}, 70%, 60%)`
              }}
            />
          </div>
        </div>
        <span style={{ 
          color: 'white', 
          fontWeight: '700', 
          fontSize: '1.1rem',
          background: `hsla(${index * 72}, 70%, 60%, 0.2)`,
          padding: '0.3rem 0.6rem',
          borderRadius: '0.5rem',
          border: `1px solid hsla(${index * 72}, 70%, 60%, 0.4)`
        }}>
          {dept.percentage}%
        </span>
      </div>
    ))}
  </div>
</div>

                {/* Card 3: Status Overview */}
                <div className="analytics-card">
                  <h3>Certificate Status</h3>
                  <div className="status-metrics">
                    <div className="metric-item">
                      <CheckCircleIcon style={{ color: '#10b981' }} />
                      <div>
                        <h4>{analytics.verified.toLocaleString()}</h4>
                        <p>Verified</p>
                      </div>
                    </div>
                    <div className="metric-item">
                      <SparklesIcon style={{ color: '#f59e0b' }} />
                      <div>
                        <h4>{analytics.pending}</h4>
                        <p>Pending</p>
                      </div>
                    </div>
                    <div className="metric-item">
                      <DocumentTextIcon style={{ color: '#3b82f6' }} />
                      <div>
                        <h4>{analytics.totalIssued.toLocaleString()}</h4>
                        <p>Total Issued</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Recent Activity */}
                <div className="analytics-card">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <CheckCircleIcon style={{ color: '#10b981' }} />
                      <span>Certificate #12349 verified</span>
                      <small>2h ago</small>
                    </div>
                    <div className="activity-item">
                      <PlusIcon style={{ color: '#3b82f6' }} />
                      <span>Certificate issued to Alice</span>
                      <small>4h ago</small>
                    </div>
                    <div className="activity-item">
                      <CloudArrowUpIcon style={{ color: '#8b5cf6' }} />
                      <span>Bulk upload completed</span>
                      <small>1d ago</small>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        )}


        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-panel">
              <h2>Institution Settings</h2>
              
              <div className="settings-sections">
                <div className="settings-section">
                  <div className="section-header">
                    <h3>Institution Details</h3>
                    <button 
                      className="edit-btn"
                      onClick={() => setIsEditingSettings(!isEditingSettings)}
                    >
                      {isEditingSettings ? <XCircleIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
                      {isEditingSettings ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  <div className="settings-form">
                    <div className="form-field">
                      <label>Institution Name</label>
                      <input 
                        type="text" 
                        value={institutionSettings.name}
                        onChange={(e) => setInstitutionSettings({...institutionSettings, name: e.target.value})}
                        readOnly={!isEditingSettings}
                      />
                    </div>
                    <div className="form-field">
                      <label>Address</label>
                      <input 
                        type="text" 
                        value={institutionSettings.address}
                        onChange={(e) => setInstitutionSettings({...institutionSettings, address: e.target.value})}
                        readOnly={!isEditingSettings}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label>Phone</label>
                        <input 
                          type="text" 
                          value={institutionSettings.phone}
                          onChange={(e) => setInstitutionSettings({...institutionSettings, phone: e.target.value})}
                          readOnly={!isEditingSettings}
                        />
                      </div>
                      <div className="form-field">
                        <label>Email</label>
                        <input 
                          type="email" 
                          value={institutionSettings.email}
                          onChange={(e) => setInstitutionSettings({...institutionSettings, email: e.target.value})}
                          readOnly={!isEditingSettings}
                        />
                      </div>
                    </div>
                    {isEditingSettings && (
                      <div className="form-actions">
                        <button className="save-btn" onClick={updateSettings}>
                          <CheckCircleIcon className="w-5 h-5" />
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Blockchain Configuration</h3>
                  <div className="settings-form">
                    <div className="form-field">
                      <label>Contract Address</label>
                      <div className="readonly-field">
                        <input type="text" value={CONTRACT_ADDRESS} readOnly />
                        <button 
                          className="copy-btn"
                          onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="form-field">
                      <label>Network</label>
                      <input type="text" value="Ethereum Sepolia" readOnly />
                    </div>
                    <div className="form-field">
                      <label>Connected Wallet</label>
                      <div className="wallet-status">
                        {isConnected ? (
                          <>
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                            <span>{account}</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-5 h-5 text-red-400" />
                            <span>No wallet connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Certificate Preview</h3>
              <button onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className="preview-certificate">
              <div className="cert-border">
                <div className="cert-header">
                  <h2>{institutionSettings.name}</h2>
                  <p>Certificate of Completion</p>
                </div>
                <div className="cert-body">
                  <p>This is to certify that</p>
                  <h3>{formData.studentName || '[Student Name]'}</h3>
                  <p>has successfully completed the requirements for</p>
                  <h4>{formData.degreeName || '[Degree Name]'}</h4>
                  {formData.department && <p>Department of {formData.department}</p>}
                  {formData.gpa && <p>GPA: {formData.gpa}</p>}
                  {formData.honors && <p>{formData.honors}</p>}
                  <p className="cert-date">
                    Date: {formData.graduationDate || new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="cert-footer">
                  <div className="signature">
                    <div className="sig-line"></div>
                    <p>Authorized Signature</p>
                  </div>
                  <div className="seal">
                    <ShieldCheckIcon className="w-16 h-16" />
                    <p>Official Seal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCertDetails && selectedCertificate && (
        <div className="modal-overlay" onClick={() => setShowCertDetails(false)}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Certificate Details</h3>
              <button onClick={() => setShowCertDetails(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Certificate ID</label>
                  <span>#{selectedCertificate.id}</span>
                </div>
                <div className="detail-item">
                  <label>Student Name</label>
                  <span>{selectedCertificate.studentName}</span>
                </div>
                <div className="detail-item">
                  <label>Degree</label>
                  <span>{selectedCertificate.degree}</span>
                </div>
                <div className="detail-item">
                  <label>Department</label>
                  <span>{selectedCertificate.department || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Issue Date</label>
                  <span>{selectedCertificate.date}</span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span className={`status-badge ${selectedCertificate.status}`}>
                    {selectedCertificate.status}
                  </span>
                </div>
                {selectedCertificate.gpa && (
                  <div className="detail-item">
                    <label>GPA</label>
                    <span>{selectedCertificate.gpa}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedCertificate && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
              <h3>Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete certificate <strong>#{selectedCertificate.id}</strong> for <strong>{selectedCertificate.studentName}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn secondary" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn danger" 
                onClick={confirmDelete}
              >
                Delete Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkUpload && (
        <div className="modal-overlay" onClick={() => setBulkUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Certificate Upload</h3>
              <button onClick={() => setBulkUpload(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="upload-area">
                <CloudArrowUpIcon className="w-16 h-16 text-blue-400" />
                <p>Upload CSV file with student data</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleBulkUpload(e.target.files)}
                  style={{ display: 'none' }}
                />
                <button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AcademicInstitution
