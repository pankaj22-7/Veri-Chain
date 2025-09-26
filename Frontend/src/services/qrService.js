// Frontend/src/services/qrService.js
import QRCode from 'qrcode'

class QRCodeService {
  /**
   * Get the correct base URL for QR codes
   */
  getBaseURL() {
    // ✅ For local development - use your actual IP or a deployed URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Option 1: Use your local IP address (change this to your computer's IP)
      // You can find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
      // return 'http://YOUR_IP_ADDRESS:3000'
      
      // Option 2: Use a deployed URL for testing (recommended)
      // Replace with your Vercel/Netlify URL when deployed
      return 'http://192.168.96.85:3000'
      
      // Option 3: For now, use localhost (will only work on same machine)
      return `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3000'}`
    }
    
    // For production deployment
    return window.location.origin
  }

  /**
   * Generate QR code for certificate verification with auto-verification support
   */
  async generateCertificateQR(certificateId, baseUrl = null) {
    try {
      console.log('📱 Generating QR code for certificate:', certificateId)
      
      // ✅ Use provided baseUrl or get the correct one
      const verificationBaseUrl = baseUrl || this.getBaseURL()
      const verificationUrl = `${verificationBaseUrl}/verifier?id=${certificateId}&autoVerify=true`
      
      console.log('🔗 Generated verification URL:', verificationUrl)
      
      const qrOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      }

      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, qrOptions)
      
      console.log('✅ QR code generated successfully')
      
      return {
        success: true,
        qrCodeUrl: qrCodeDataUrl,
        verificationUrl: verificationUrl,
        certificateId: certificateId
      }
    } catch (error) {
      console.error('❌ QR Code generation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * ✅ NEW: Generate test QR code with demo URL
   */
  async generateTestQR(certificateId = 'DEMO') {
    try {
      // For immediate testing - use a demo verification page
      const verificationUrl = `https://your-demo-site.vercel.app/verifier?id=${certificateId}&autoVerify=true`
      
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      return {
        success: true,
        qrCodeUrl: qrCodeDataUrl,
        verificationUrl: verificationUrl,
        certificateId: certificateId
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate QR code for certificate embedding (for certificate processor)
   */
  async generateEmbedQR(certificateId, baseUrl = null) {
    try {
      const verificationBaseUrl = baseUrl || this.getBaseURL()
      const verificationUrl = `${verificationBaseUrl}/verifier?id=${certificateId}&autoVerify=true&source=embedded`
      
      const qrOptions = {
        errorCorrectionLevel: 'H', // Higher error correction for embedding
        type: 'image/png',
        quality: 0.95,
        margin: 1, // Smaller margin for embedding
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 120 // Smaller size for embedding
      }

      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, qrOptions)
      
      return {
        success: true,
        qrCodeUrl: qrCodeDataUrl,
        verificationUrl: verificationUrl
      }
    } catch (error) {
      console.error('❌ QR Code embedding generation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate QR code for batch certificates
   */
  async generateBatchQR(certificateIds, baseUrl = null) {
    console.log('🔄 Generating QR codes for batch certificates:', certificateIds.length)
    const results = []
    
    for (const id of certificateIds) {
      const qrResult = await this.generateCertificateQR(id, baseUrl)
      results.push({
        certificateId: id,
        ...qrResult
      })
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('✅ Batch QR generation completed')
    return results
  }

  /**
   * Download QR code as image
   */
  downloadQRCode(qrCodeUrl, certificateId) {
    try {
      const link = document.createElement('a')
      link.download = `certificate-qr-${certificateId}.png`
      link.href = qrCodeUrl
      
      // For better compatibility
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('📁 QR code downloaded:', certificateId)
      return { success: true }
    } catch (error) {
      console.error('❌ QR code download failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate QR code with custom styling for certificates
   */
  async generateStyledQR(certificateId, options = {}) {
    const defaultOptions = {
      baseUrl: null, // Will use getBaseURL()
      size: 200,
      margin: 2,
      darkColor: '#000000',
      lightColor: '#FFFFFF',
      errorCorrectionLevel: 'M',
      includeText: true,
      textColor: '#333333',
      borderColor: '#06b6d4',
      borderWidth: 2
    }
    
    const config = { ...defaultOptions, ...options }
    
    try {
      const verificationBaseUrl = config.baseUrl || this.getBaseURL()
      const verificationUrl = `${verificationBaseUrl}/verifier?id=${certificateId}&autoVerify=true`
      
      const qrOptions = {
        errorCorrectionLevel: config.errorCorrectionLevel,
        type: 'image/png',
        quality: 0.92,
        margin: config.margin,
        color: {
          dark: config.darkColor,
          light: config.lightColor
        },
        width: config.size
      }

      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, qrOptions)
      
      if (config.includeText) {
        // Create canvas for adding text and styling
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const img = new Image()
        await new Promise((resolve) => {
          img.onload = () => {
            const padding = 20
            canvas.width = config.size + (padding * 2)
            canvas.height = config.size + (padding * 3) + 40 // Extra space for text
            
            // White background
            ctx.fillStyle = config.lightColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Border
            if (config.borderWidth > 0) {
              ctx.strokeStyle = config.borderColor
              ctx.lineWidth = config.borderWidth
              ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)
            }
            
            // Draw QR code
            ctx.drawImage(img, padding, padding, config.size, config.size)
            
            // Add text
            ctx.fillStyle = config.textColor
            ctx.font = 'bold 14px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Scan to Verify Certificate', canvas.width / 2, config.size + padding + 25)
            
            ctx.font = '12px Arial'
            ctx.fillText(`ID: ${certificateId}`, canvas.width / 2, config.size + padding + 45)
            
            ctx.font = '10px Arial'
            ctx.fillStyle = config.borderColor
            ctx.fillText('Blockchain Verified ✓', canvas.width / 2, config.size + padding + 60)
            
            resolve()
          }
          img.src = qrCodeDataUrl
        })
        
        const styledQrUrl = canvas.toDataURL('image/png')
        
        return {
          success: true,
          qrCodeUrl: styledQrUrl,
          verificationUrl: verificationUrl,
          certificateId: certificateId
        }
      }
      
      return {
        success: true,
        qrCodeUrl: qrCodeDataUrl,
        verificationUrl: verificationUrl,
        certificateId: certificateId
      }
    } catch (error) {
      console.error('❌ Styled QR Code generation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate verification badge HTML (for emails, etc.)
   */
  generateVerificationBadge(certificateId, qrCodeUrl) {
    return `
      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        padding: 1.5rem; 
        border: 2px solid #06b6d4; 
        border-radius: 16px; 
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        box-shadow: 0 8px 24px rgba(6, 182, 212, 0.15);
        max-width: 220px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: #ffffff; 
          padding: 0.75rem; 
          border-radius: 12px; 
          border: 1px solid #e2e8f0;
          margin-bottom: 1rem;
        ">
          <img src="${qrCodeUrl}" alt="Certificate QR Code" style="
            width: 150px; 
            height: 150px; 
            display: block;
          " />
        </div>
        <h4 style="
          margin: 0 0 0.5rem 0; 
          font-size: 1rem; 
          color: #1e293b; 
          font-weight: 600;
          text-align: center;
        ">
          📱 Scan to Verify
        </h4>
        <p style="
          margin: 0 0 0.75rem 0; 
          font-size: 0.85rem; 
          color: #64748b; 
          text-align: center;
          line-height: 1.4;
        ">
          Certificate ID: <strong>${certificateId}</strong><br/>
          Instant Blockchain Verification
        </p>
        <div style="
          display: flex; 
          align-items: center; 
          gap: 0.5rem;
          background: rgba(6, 182, 212, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(6, 182, 212, 0.2);
        ">
          <span style="color: #06b6d4; font-size: 0.75rem; font-weight: 600;">
            🔒 BLOCKCHAIN VERIFIED
          </span>
        </div>
      </div>
    `
  }

  /**
   * Generate shareable QR code URL for social media
   */
  generateShareableQR(certificateId, studentName, degreeName) {
    const baseUrl = this.getBaseURL()
    const verificationUrl = `${baseUrl}/verifier?id=${certificateId}&autoVerify=true&shared=true`
    
    return {
      url: verificationUrl,
      text: `🎓 Verify ${studentName}'s ${degreeName} certificate on the blockchain!\n\n📱 Scan QR or click: ${verificationUrl}\n\n🔒 Blockchain verified • Instantly authentic`,
      hashtags: ['BlockchainCertificate', 'VerifiedEducation', 'NFTCertificate', 'CryptoEducation']
    }
  }

  /**
   * Validate QR code URL format
   */
  isValidVerificationURL(url) {
    try {
      const urlObj = new URL(url)
      const params = new URLSearchParams(urlObj.search)
      
      return (
        (urlObj.pathname === '/verifier' || urlObj.pathname === '/verify') &&
        params.has('id') &&
        params.get('id').trim() !== ''
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Extract certificate ID from verification URL
   */
  extractCertificateId(url) {
    try {
      const urlObj = new URL(url)
      const params = new URLSearchParams(urlObj.search)
      return params.get('id')
    } catch (error) {
      return null
    }
  }

  /**
   * Generate QR code for mobile app deep linking
   */
  async generateDeepLinkQR(certificateId, appScheme = 'verichain') {
    try {
      const deepLinkUrl = `${appScheme}://verify?id=${certificateId}`
      const fallbackUrl = `${this.getBaseURL()}/verifier?id=${certificateId}&autoVerify=true`
      
      // Universal link format for both app and web
      const universalUrl = `${this.getBaseURL()}/verify?id=${certificateId}&app=${appScheme}&fallback=${encodeURIComponent(fallbackUrl)}`
      
      const qrCodeDataUrl = await QRCode.toDataURL(universalUrl, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2
      })
      
      return {
        success: true,
        qrCodeUrl: qrCodeDataUrl,
        deepLinkUrl: deepLinkUrl,
        fallbackUrl: fallbackUrl,
        universalUrl: universalUrl
      }
    } catch (error) {
      console.error('❌ Deep link QR generation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * ✅ NEW: Set custom base URL for testing
   */
  setTestURL(url) {
    this._testURL = url
    return this
  }

  /**
   * ✅ NEW: Get test URL if set
   */
  getTestURL() {
    return this._testURL
  }
}

export default new QRCodeService()
