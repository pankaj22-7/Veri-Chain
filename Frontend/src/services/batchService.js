// Frontend/src/services/batchService.js
import { ethers } from 'ethers'
import qrService from './qrService'
import emailService from './emailService'

class BatchOperationsService {
  constructor() {
    this.contractAddress = "0xd20d0A374d034BCA79046bB8bC2cFBB4c307d61c"
    this.contractABI = [
      "function issueCertificate(address recipient, string studentName, string degreeName, string ipfsHash) external returns (uint256)",
      "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string studentName, string degreeName, string ipfsHash, address indexed issuer)"
    ]
  }

  /**
   * Process batch certificate issuance
   */
  async processBatchIssuance(certificates, walletProvider, progressCallback) {
    const results = []
    let successCount = 0
    let failureCount = 0
    
    try {
      const signer = await walletProvider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, signer)
      
      for (let i = 0; i < certificates.length; i++) {
        const cert = certificates[i]
        
        try {
          // Update progress
          if (progressCallback) {
            progressCallback({
              current: i + 1,
              total: certificates.length,
              status: `Processing ${cert.studentName}...`,
              percentage: Math.round(((i + 1) / certificates.length) * 100)
            })
          }
          
          // Validate certificate data
          const validation = this.validateCertificateData(cert)
          if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
          }
          
          // Issue certificate
          const tx = await contract.issueCertificate(
            cert.studentWallet,
            cert.studentName,
            cert.degreeName,
            cert.ipfsHash || ''
          )
          
          console.log(`⏳ Certificate ${i + 1}/${certificates.length} transaction:`, tx.hash)
          
          const receipt = await tx.wait()
          
          // Extract token ID
          let tokenId = null
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log)
              if (parsed.name === 'CertificateIssued') {
                tokenId = parsed.args.tokenId.toString()
                break
              }
            } catch (e) {
              // Skip irrelevant logs
            }
          }
          
          const result = {
            index: i,
            studentName: cert.studentName,
            success: true,
            tokenId: tokenId,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            issueDate: new Date().toISOString()
          }
          
          results.push(result)
          successCount++
          
          console.log(`✅ Certificate ${i + 1} issued successfully: Token ID ${tokenId}`)
          
          // Generate QR code
          if (tokenId) {
            try {
              const qrResult = await qrService.generateCertificateQR(tokenId)
              if (qrResult.success) {
                result.qrCode = qrResult.qrCodeUrl
                result.verificationUrl = qrResult.verificationUrl
              }
            } catch (qrError) {
              console.log('QR generation failed:', qrError)
            }
          }
          
          // Send email notification
          if (cert.studentEmail) {
            try {
              const emailResult = await emailService.sendCertificateNotification({
                id: tokenId,
                studentName: cert.studentName,
                degreeName: cert.degreeName,
                issueDate: new Date().toLocaleDateString(),
                txHash: receipt.hash
              }, cert.studentEmail)
              
              result.emailSent = emailResult.success
            } catch (emailError) {
              console.log('Email notification failed:', emailError)
              result.emailSent = false
            }
          }
          
          // Add delay between transactions to avoid nonce issues
          if (i < certificates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
          
        } catch (certError) {
          console.error(`❌ Certificate ${i + 1} failed:`, certError)
          
          results.push({
            index: i,
            studentName: cert.studentName,
            success: false,
            error: certError.reason || certError.message,
            tokenId: null
          })
          
          failureCount++
        }
      }
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          current: certificates.length,
          total: certificates.length,
          status: 'Batch processing completed',
          percentage: 100,
          completed: true
        })
      }
      
      return {
        success: true,
        summary: {
          total: certificates.length,
          successful: successCount,
          failed: failureCount,
          successRate: Math.round((successCount / certificates.length) * 100)
        },
        results: results
      }
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error)
      return {
        success: false,
        error: error.message,
        results: results
      }
    }
  }

  /**
   * Validate certificate data
   */
  validateCertificateData(certificate) {
    const errors = []
    
    if (!certificate.studentName || certificate.studentName.trim() === '') {
      errors.push('Student name is required')
    }
    
    if (!certificate.degreeName || certificate.degreeName.trim() === '') {
      errors.push('Degree name is required')
    }
    
    if (!certificate.studentWallet || !ethers.isAddress(certificate.studentWallet)) {
      errors.push('Valid student wallet address is required')
    }
    
    if (certificate.studentEmail && !this.isValidEmail(certificate.studentEmail)) {
      errors.push('Valid email address is required')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  /**
   * Validate email address
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Parse CSV file for batch import
   */
  async parseCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const csv = event.target.result
          const lines = csv.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            throw new Error('CSV file must contain at least a header and one data row')
          }
          
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          const requiredHeaders = ['studentname', 'degreename', 'studentwallet']
          
          // Check required headers
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
          }
          
          const certificates = []
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim())
            
            if (values.length !== headers.length) {
              console.warn(`Row ${i + 1} has incorrect number of columns, skipping...`)
              continue
            }
            
            const certificate = {}
            headers.forEach((header, index) => {
              certificate[this.mapHeaderToField(header)] = values[index]
            })
            
            // Add default values
            certificate.ipfsHash = certificate.ipfsHash || ''
            certificate.issueDate = new Date().toISOString()
            
            certificates.push(certificate)
          }
          
          resolve({
            success: true,
            certificates: certificates,
            totalRows: certificates.length
          })
          
        } catch (error) {
          reject({
            success: false,
            error: error.message
          })
        }
      }
      
      reader.onerror = () => {
        reject({
          success: false,
          error: 'Failed to read CSV file'
        })
      }
      
      reader.readAsText(file)
    })
  }

  /**
   * Map CSV headers to certificate fields
   */
  mapHeaderToField(header) {
    const mapping = {
      'studentname': 'studentName',
      'degreename': 'degreeName',
      'studentwallet': 'studentWallet',
      'studentemail': 'studentEmail',
      'department': 'department',
      'gpa': 'gpa',
      'honors': 'honors',
      'ipfshash': 'ipfsHash'
    }
    
    return mapping[header] || header
  }

  /**
   * Generate CSV template
   */
  generateCSVTemplate() {
    const headers = [
      'studentName',
      'degreeName', 
      'studentWallet',
      'studentEmail',
      'department',
      'gpa',
      'honors'
    ]
    
    const sampleData = [
      'John Doe',
      'Bachelor of Computer Science',
      '0x742d35Cc6634C0532925a3b8D098d7c47165aAbe',
      'john.doe@example.com',
      'Computer Science',
      '3.85',
      'Magna Cum Laude'
    ]
    
    return {
      headers: headers.join(','),
      sample: sampleData.join(','),
      fullTemplate: [headers.join(','), sampleData.join(',')].join('\n')
    }
  }

  /**
   * Generate batch report
   */
  generateBatchReport(batchResult) {
    const { summary, results } = batchResult
    
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    return {
      reportId: `batch-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      summary: summary,
      successful: successful,
      failed: failed,
      statistics: {
        averageGasUsed: successful.length > 0 ? 
          Math.round(successful.reduce((sum, r) => sum + (parseInt(r.gasUsed) || 0), 0) / successful.length) : 0,
        totalGasUsed: successful.reduce((sum, r) => sum + (parseInt(r.gasUsed) || 0), 0),
        processingTime: results.length > 0 ? 
          `${results.length * 2} seconds (estimated)` : '0 seconds'
      }
    }
  }
}

export default new BatchOperationsService()
