// Certificate Viewer Service
class CertificateViewer {
  async loadCertificateImage(ipfsHash) {
    if (!ipfsHash || ipfsHash === 'QmDefaultHashForCertificateWithoutFile123456789') {
      return {
        success: false,
        error: 'No certificate image available',
        imageUrl: null
      }
    }

    try {
      // Convert IPFS hash to viewable URL
      const ipfsGatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      
      // Test if the URL is accessible
      const response = await fetch(ipfsGatewayUrl, { method: 'HEAD' })
      
      if (response.ok) {
        return {
          success: true,
          imageUrl: ipfsGatewayUrl,
          contentType: response.headers.get('content-type')
        }
      } else {
        // Fallback to other IPFS gateways
        const fallbackGateways = [
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
          `https://dweb.link/ipfs/${ipfsHash}`
        ]
        
        for (const gatewayUrl of fallbackGateways) {
          try {
            const testResponse = await fetch(gatewayUrl, { method: 'HEAD' })
            if (testResponse.ok) {
              return {
                success: true,
                imageUrl: gatewayUrl,
                contentType: testResponse.headers.get('content-type')
              }
            }
          } catch (error) {
            continue // Try next gateway
          }
        }
        
        throw new Error('Certificate image not accessible from IPFS')
      }
    } catch (error) {
      console.error('Failed to load certificate image:', error)
      return {
        success: false,
        error: error.message,
        imageUrl: null
      }
    }
  }

  async downloadCertificate(ipfsHash, certificateId, studentName) {
    try {
      const result = await this.loadCertificateImage(ipfsHash)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Download the certificate
      const response = await fetch(result.imageUrl)
      const blob = await response.blob()
      
      // Determine file extension
      const contentType = result.contentType || 'application/octet-stream'
      let extension = 'pdf'
      
      if (contentType.includes('image/png')) extension = 'png'
      else if (contentType.includes('image/jpeg')) extension = 'jpg'
      else if (contentType.includes('application/pdf')) extension = 'pdf'
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificateId}-${studentName.replace(/\s+/g, '-')}.${extension}`
      link.click()
      
      // Cleanup
      URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      console.error('Certificate download failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new CertificateViewer()
