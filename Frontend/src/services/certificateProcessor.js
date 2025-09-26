import QRCode from 'qrcode'
import { PDFDocument, rgb } from 'pdf-lib'

class CertificateProcessor {
  async processAndEmbedQR(originalFile, certificateId, verificationUrl) {
    try {
      console.log('🎨 Processing certificate with QR code embedding...')
      
      const fileExtension = originalFile.name.split('.').pop().toLowerCase()
      
      if (fileExtension === 'pdf') {
        return await this.embedQRInPDF(originalFile, certificateId, verificationUrl)
      } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
        return await this.embedQRInImage(originalFile, certificateId, verificationUrl)
      } else {
        throw new Error('Unsupported file format. Please use PDF, JPG, or PNG.')
      }
    } catch (error) {
      console.error('❌ Certificate processing failed:', error)
      throw error
    }
  }

  async embedQRInPDF(pdfFile, certificateId, verificationUrl) {
    try {
      console.log('📄 Processing PDF certificate...')
      
      // Read the original PDF
      const pdfBytes = await pdfFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(pdfBytes)
      
      // Get the first page
      const pages = pdfDoc.getPages()
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      
      // Generate QR code as PNG
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 120,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Convert data URL to bytes
      const qrImageBytes = this.dataURLToBytes(qrCodeDataUrl)
      
      // Embed QR code image in PDF
      const qrImage = await pdfDoc.embedPng(qrImageBytes)
      
      // Position QR code (bottom-right corner with padding)
      const qrSize = 100
      const padding = 20
      
      firstPage.drawImage(qrImage, {
        x: width - qrSize - padding,
        y: padding,
        width: qrSize,
        height: qrSize,
      })
      
      // Add verification text
      firstPage.drawText('Verify at:', {
        x: width - qrSize - padding,
        y: padding + qrSize + 10,
        size: 8,
        color: rgb(0, 0, 0),
      })
      
      firstPage.drawText('verichain.verify', {
        x: width - qrSize - padding,
        y: padding + qrSize + 22,
        size: 8,
        color: rgb(0.2, 0.2, 0.8),
      })
      
      // Add certificate ID
      firstPage.drawText(`ID: ${certificateId}`, {
        x: width - qrSize - padding,
        y: padding - 15,
        size: 6,
        color: rgb(0.5, 0.5, 0.5),
      })
      
      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save()
      
      // Create new File object
      const enhancedFile = new File([modifiedPdfBytes], 
        `certificate-${certificateId}-with-qr.pdf`, 
        { type: 'application/pdf' }
      )
      
      console.log('✅ PDF certificate enhanced with QR code')
      return {
        success: true,
        enhancedFile,
        qrCodeUrl: qrCodeDataUrl,
        verificationUrl
      }
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error)
      throw error
    }
  }

  async embedQRInImage(imageFile, certificateId, verificationUrl) {
    try {
      console.log('🖼️ Processing image certificate...')
      
      // Create canvas for image processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Load original image
      const img = await this.loadImage(imageFile)
      
      // Set canvas size to image size
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Load QR code image
      const qrImg = await this.loadImageFromDataURL(qrCodeDataUrl)
      
      // Position QR code (bottom-right with padding)
      const qrSize = 120
      const padding = 20
      
      // Add white background for QR code
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillRect(
        img.width - qrSize - padding - 10, 
        img.height - qrSize - padding - 30, 
        qrSize + 20, 
        qrSize + 40
      )
      
      // Draw QR code
      ctx.drawImage(qrImg, 
        img.width - qrSize - padding, 
        img.height - qrSize - padding, 
        qrSize, 
        qrSize
      )
      
      // Add verification text
      ctx.fillStyle = 'black'
      ctx.font = '12px Arial'
      ctx.fillText('Verify Certificate:', 
        img.width - qrSize - padding, 
        img.height - qrSize - padding + qrSize + 15
      )
      
      // Add certificate ID
      ctx.font = '10px Arial'
      ctx.fillStyle = 'gray'
      ctx.fillText(`ID: ${certificateId}`, 
        img.width - qrSize - padding, 
        img.height - padding - 5
      )
      
      // Convert canvas to blob
      const blob = await this.canvasToBlob(canvas)
      
      // Create new File object
      const enhancedFile = new File([blob], 
        `certificate-${certificateId}-with-qr.png`, 
        { type: 'image/png' }
      )
      
      console.log('✅ Image certificate enhanced with QR code')
      return {
        success: true,
        enhancedFile,
        qrCodeUrl: qrCodeDataUrl,
        verificationUrl
      }
      
    } catch (error) {
      console.error('❌ Image processing failed:', error)
      throw error
    }
  }

  // Helper methods
  dataURLToBytes(dataURL) {
    const base64 = dataURL.split(',')[1]
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  loadImageFromDataURL(dataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = dataURL
    })
  }

  canvasToBlob(canvas) {
    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })
  }

  // Generate verification URL
  generateVerificationURL(certificateId) {
    return `${window.location.origin}/verify?id=${certificateId}`
  }
}

export default new CertificateProcessor()
