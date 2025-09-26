import QRCode from 'qrcode'
import qrService from './qrService'

class EnhancedCertificateViewer {
  async viewCertificateWithQR(certificate) {
    try {
      console.log('🖼️ Loading certificate and adding QR code overlay...')
      
      // Step 1: Load original certificate from IPFS
      let certificateImageUrl = null
      
      if (certificate.ipfsHash && certificate.ipfsHash !== 'QmDefaultHashForCertificateWithoutFile123456789') {
        const ipfsGateways = [
          `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`,
          `https://ipfs.io/ipfs/${certificate.ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${certificate.ipfsHash}`
        ]
        
        for (const gatewayUrl of ipfsGateways) {
          try {
            const response = await fetch(gatewayUrl, { method: 'HEAD' })
            if (response.ok) {
              certificateImageUrl = gatewayUrl
              break
            }
          } catch (error) {
            continue
          }
        }
      }
      
      if (!certificateImageUrl) {
        return {
          success: false,
          error: 'Certificate image not found on IPFS',
          originalUrl: null,
          enhancedUrl: null
        }
      }
      
      // ✅ Step 2: Use QR service for consistent auto-verification QR generation
      console.log('📱 Generating auto-verification QR code...')
      const qrResult = await qrService.generateCertificateQR(certificate.id)
      
      if (!qrResult.success) {
        console.warn('⚠️ QR service failed, using fallback generation')
        // Fallback to direct generation with auto-verification
        const verificationUrl = `${window.location.origin}/verifier?id=${certificate.id}&autoVerify=true`
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 120,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        // Step 3: Create enhanced version with QR overlay
        const enhancedUrl = await this.addQROverlay(certificateImageUrl, qrCodeDataUrl, certificate)
        
        return {
          success: true,
          originalUrl: certificateImageUrl,
          enhancedUrl: enhancedUrl,
          qrCodeUrl: qrCodeDataUrl,
          verificationUrl: verificationUrl
        }
      }
      
      console.log('✅ QR service generated auto-verification QR successfully')
      console.log('🔗 Verification URL:', qrResult.verificationUrl)
      
      // Step 3: Create enhanced version with QR overlay using QR service result
      const enhancedUrl = await this.addQROverlay(
        certificateImageUrl, 
        qrResult.qrCodeUrl, 
        certificate
      )
      
      return {
        success: true,
        originalUrl: certificateImageUrl,
        enhancedUrl: enhancedUrl,
        qrCodeUrl: qrResult.qrCodeUrl,
        verificationUrl: qrResult.verificationUrl
      }
      
    } catch (error) {
      console.error('❌ Enhanced certificate viewing failed:', error)
      return {
        success: false,
        error: error.message,
        originalUrl: null,
        enhancedUrl: null
      }
    }
  }
  
  async addQROverlay(imageUrl, qrCodeDataUrl, certificate) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎨 Adding QR code overlay to certificate image...')
        
        // Create canvas for image processing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Load original certificate image
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          // Set canvas size to image size
          canvas.width = img.width
          canvas.height = img.height
          
          console.log(`📏 Canvas size: ${canvas.width}x${canvas.height}`)
          
          // Draw original image
          ctx.drawImage(img, 0, 0)
          
          // Load and add QR code
          const qrImg = new Image()
          qrImg.onload = () => {
            // ✅ Enhanced QR code positioning and styling
            const qrSize = Math.min(150, img.width * 0.18, img.height * 0.18) // Slightly larger
            const padding = 25
            
            // Calculate position (bottom-right with padding)
            const qrX = img.width - qrSize - padding
            const qrY = img.height - qrSize - padding - 40 // Extra space for text
            
            // Add enhanced white background with shadow effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
            ctx.shadowBlur = 8
            ctx.shadowOffsetX = 2
            ctx.shadowOffsetY = 2
            
            // Background rectangle
            const bgPadding = 12
            ctx.fillRect(
              qrX - bgPadding,
              qrY - bgPadding - 25, // Space for header text
              qrSize + (bgPadding * 2),
              qrSize + (bgPadding * 2) + 45 // Space for texts
            )
            
            // Reset shadow for other elements
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 0
            
            // Add subtle border
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'
            ctx.lineWidth = 2
            ctx.strokeRect(
              qrX - bgPadding,
              qrY - bgPadding - 25,
              qrSize + (bgPadding * 2),
              qrSize + (bgPadding * 2) + 45
            )
            
            // ✅ Add header text - "SCAN TO VERIFY"
            ctx.fillStyle = '#06b6d4'
            ctx.font = `bold ${Math.max(11, qrSize * 0.08)}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText('📱 SCAN TO VERIFY', 
              qrX + (qrSize / 2), 
              qrY - bgPadding - 8
            )
            
            // Draw QR code
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
            
            // ✅ Add enhanced verification text
            ctx.fillStyle = '#1e293b'
            ctx.font = `${Math.max(9, qrSize * 0.06)}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText('Blockchain Verified Certificate', 
              qrX + (qrSize / 2), 
              qrY + qrSize + bgPadding - 2
            )
            
            // Add certificate ID with styling
            ctx.font = `${Math.max(8, qrSize * 0.055)}px Arial`
            ctx.fillStyle = '#64748b'
            ctx.fillText(`ID: ${certificate.id}`, 
              qrX + (qrSize / 2), 
              qrY + qrSize + bgPadding + 12
            )
            
            // ✅ Add small verification badge
            ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'
            ctx.fillRect(
              qrX + (qrSize / 2) - 30,
              qrY + qrSize + bgPadding + 18,
              60,
              16
            )
            
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'
            ctx.lineWidth = 1
            ctx.strokeRect(
              qrX + (qrSize / 2) - 30,
              qrY + qrSize + bgPadding + 18,
              60,
              16
            )
            
            ctx.fillStyle = '#10b981'
            ctx.font = `bold ${Math.max(7, qrSize * 0.045)}px Arial`
            ctx.textAlign = 'center'
            ctx.fillText('✓ AUTHENTIC', 
              qrX + (qrSize / 2), 
              qrY + qrSize + bgPadding + 28
            )
            
            console.log('✅ QR code overlay added successfully')
            
            // Convert canvas to blob URL
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob)
              console.log('📁 Enhanced certificate blob URL created')
              resolve(url)
            }, 'image/png', 0.95) // High quality
          }
          
          qrImg.onerror = () => {
            console.error('❌ Failed to load QR code for overlay')
            reject(new Error('Failed to load QR code'))
          }
          qrImg.src = qrCodeDataUrl
        }
        
        img.onerror = () => {
          console.error('❌ Failed to load certificate image for overlay')
          reject(new Error('Failed to load certificate image'))
        }
        img.src = imageUrl
        
      } catch (error) {
        console.error('❌ QR overlay creation failed:', error)
        reject(error)
      }
    })
  }
  
  // ✅ Enhanced cleanup method with logging
  cleanupUrl(url) {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url)
        console.log('🧹 Blob URL cleaned up successfully')
      } catch (error) {
        console.warn('⚠️ Blob URL cleanup failed:', error)
      }
    }
  }
  
  // ✅ NEW: Get QR code details for a certificate
  async getQRDetails(certificateId) {
    try {
      const qrResult = await qrService.generateCertificateQR(certificateId)
      return qrResult
    } catch (error) {
      console.error('❌ Failed to get QR details:', error)
      return { success: false, error: error.message }
    }
  }
  
  // ✅ NEW: Download enhanced certificate
  async downloadEnhancedCertificate(certificate, filename = null) {
    try {
      const result = await this.viewCertificateWithQR(certificate)
      
      if (result.success && result.enhancedUrl) {
        // Convert blob to downloadable file
        const response = await fetch(result.enhancedUrl)
        const blob = await response.blob()
        
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename || `${certificate.studentName.replace(/\s+/g, '-')}-certificate-with-qr.png`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Cleanup
        URL.revokeObjectURL(link.href)
        this.cleanupUrl(result.enhancedUrl)
        
        console.log('📁 Enhanced certificate downloaded successfully')
        return { success: true }
      } else {
        throw new Error(result.error || 'Failed to generate enhanced certificate')
      }
    } catch (error) {
      console.error('❌ Enhanced certificate download failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // ✅ NEW: Generate shareable QR code for certificate
  async generateShareableQR(certificate) {
    try {
      const shareData = qrService.generateShareableQR(
        certificate.id, 
        certificate.studentName, 
        certificate.degreeName
      )
      
      const qrResult = await qrService.generateStyledQR(certificate.id, {
        includeText: true,
        size: 250,
        borderColor: '#06b6d4',
        borderWidth: 3
      })
      
      return {
        success: true,
        qrCodeUrl: qrResult.qrCodeUrl,
        shareText: shareData.text,
        shareUrl: shareData.url,
        hashtags: shareData.hashtags
      }
    } catch (error) {
      console.error('❌ Shareable QR generation failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new EnhancedCertificateViewer()
