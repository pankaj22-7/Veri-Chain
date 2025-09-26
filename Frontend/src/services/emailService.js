// Frontend/src/services/emailService.js
class EmailService {
  constructor() {
    // You can integrate with EmailJS, SendGrid, or your backend API
    this.emailjsPublicKey = 'your-emailjs-public-key' // Replace with actual key
    this.emailjsServiceId = 'your-service-id' // Replace with actual service ID
    this.emailjsTemplateId = 'your-template-id' // Replace with actual template ID
  }

  /**
   * Send certificate issuance notification
   */
  async sendCertificateNotification(certificateData, recipientEmail) {
    try {
      const emailData = {
        to_email: recipientEmail,
        to_name: certificateData.studentName,
        certificate_id: certificateData.id,
        degree_name: certificateData.degreeName,
        institution_name: certificateData.institutionName || 'VeriTech University',
        issue_date: certificateData.issueDate || new Date().toLocaleDateString(),
        verification_url: `${window.location.origin}/verify?id=${certificateData.id}`,
        certificate_url: certificateData.ipfsHash ? 
          `https://gateway.pinata.cloud/ipfs/${certificateData.ipfsHash}` : '',
        blockchain_hash: certificateData.txHash || 'Blockchain verified',
        message: `Congratulations! Your ${certificateData.degreeName} certificate has been issued and is now available on the blockchain.`
      }

      // For demo purposes, we'll simulate email sending
      // In production, integrate with EmailJS or your backend
      console.log('📧 Email notification sent:', emailData)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        message: 'Certificate notification sent successfully',
        emailData
      }
    } catch (error) {
      console.error('Email notification failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Send batch certificate notifications
   */
  async sendBatchNotifications(certificates) {
    const results = []
    
    for (const cert of certificates) {
      if (cert.studentEmail) {
        const emailResult = await this.sendCertificateNotification(cert, cert.studentEmail)
        results.push({
          certificateId: cert.id,
          email: cert.studentEmail,
          ...emailResult
        })
      }
    }
    
    return results
  }

  /**
   * Send verification alert to institution
   */
  async sendVerificationAlert(certificateId, verifierInfo, institutionEmail) {
    try {
      const alertData = {
        to_email: institutionEmail,
        certificate_id: certificateId,
        verifier_address: verifierInfo.address || 'Unknown',
        verification_time: new Date().toLocaleString(),
        verification_url: `${window.location.origin}/verify?id=${certificateId}`,
        message: `Certificate #${certificateId} was verified by ${verifierInfo.address}`
      }

      console.log('🔔 Verification alert sent:', alertData)
      
      return {
        success: true,
        message: 'Verification alert sent to institution',
        alertData
      }
    } catch (error) {
      console.error('Verification alert failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate email template preview
   */
  generateEmailPreview(certificateData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
        <div style="background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); width: 60px; height: 60px; border-radius: 12px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">🎓</span>
            </div>
            <h1 style="color: #0f172a; margin: 0; font-size: 1.5rem;">Certificate Issued!</h1>
            <p style="color: #64748b; margin: 0.5rem 0 0 0;">Your blockchain certificate is ready</p>
          </div>

          <!-- Certificate Details -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
            <h3 style="color: #0f172a; margin: 0 0 1rem 0;">Certificate Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 0.5rem 0; color: #64748b; font-weight: 500;">Student:</td>
                <td style="padding: 0.5rem 0; color: #0f172a; font-weight: 600;">${certificateData.studentName}</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem 0; color: #64748b; font-weight: 500;">Degree:</td>
                <td style="padding: 0.5rem 0; color: #0f172a; font-weight: 600;">${certificateData.degreeName}</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem 0; color: #64748b; font-weight: 500;">Institution:</td>
                <td style="padding: 0.5rem 0; color: #0f172a; font-weight: 600;">${certificateData.institutionName}</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem 0; color: #64748b; font-weight: 500;">Certificate ID:</td>
                <td style="padding: 0.5rem 0; color: #06b6d4; font-weight: 600; font-family: monospace;">#${certificateData.id}</td>
              </tr>
            </table>
          </div>

          <!-- Actions -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <a href="${window.location.origin}/verify?id=${certificateData.id}" 
               style="background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-right: 1rem;">
              Verify Certificate
            </a>
            ${certificateData.ipfsHash ? `
              <a href="https://gateway.pinata.cloud/ipfs/${certificateData.ipfsHash}" 
                 style="background: #10b981; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Download PDF
              </a>
            ` : ''}
          </div>

          <!-- Blockchain Info -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem; text-align: center;">
            <p style="color: #64748b; font-size: 0.9rem; margin: 0;">
              🔗 This certificate is secured on the blockchain and can be verified at any time.
            </p>
            <p style="color: #64748b; font-size: 0.8rem; margin: 0.5rem 0 0 0;">
              Powered by VeriTech • Blockchain Certificate Platform
            </p>
          </div>
        </div>
      </div>
    `
  }
}

export default new EmailService()
