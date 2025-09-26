// Frontend/src/services/revocationService.js
import { ethers } from 'ethers'

class RevocationService {
  constructor() {
    this.contractAddress = "0xd20d0A374d034BCA79046bB8bC2cFBB4c307d61c"
    this.contractABI = [
      "function revokeCertificate(uint256 tokenId, string reason) external",
      "function isRevoked(uint256 tokenId) external view returns (bool)",
      "function getRevocationInfo(uint256 tokenId) external view returns (bool isRevoked, string reason, uint256 revokedAt, address revokedBy)",
      "event CertificateRevoked(uint256 indexed tokenId, string reason, address indexed revokedBy)"
    ]
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(tokenId, reason, walletProvider) {
    try {
      console.log('🚫 Revoking certificate:', tokenId, 'Reason:', reason)
      
      if (!walletProvider) {
        throw new Error('Wallet not connected')
      }

      const signer = await walletProvider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, signer)
      
      // Check if certificate exists and is not already revoked
      const isAlreadyRevoked = await contract.isRevoked(tokenId)
      if (isAlreadyRevoked) {
        throw new Error('Certificate is already revoked')
      }

      // Revoke the certificate
      const tx = await contract.revokeCertificate(tokenId, reason)
      
      console.log('⏳ Revocation transaction submitted:', tx.hash)
      
      const receipt = await tx.wait()
      
      console.log('✅ Certificate revoked successfully!', receipt)
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        tokenId: tokenId,
        reason: reason,
        revokedAt: new Date().toISOString(),
        message: 'Certificate revoked successfully'
      }
    } catch (error) {
      console.error('❌ Certificate revocation failed:', error)
      return {
        success: false,
        error: error.reason || error.message,
        tokenId: tokenId
      }
    }
  }

  /**
   * Check if certificate is revoked
   */
  async checkRevocationStatus(tokenId, provider) {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, provider)
      
      const revocationInfo = await contract.getRevocationInfo(tokenId)
      
      return {
        success: true,
        tokenId: tokenId,
        isRevoked: revocationInfo.isRevoked,
        reason: revocationInfo.reason,
        revokedAt: revocationInfo.revokedAt > 0 ? 
          new Date(Number(revocationInfo.revokedAt) * 1000).toISOString() : null,
        revokedBy: revocationInfo.revokedBy
      }
    } catch (error) {
      console.error('❌ Revocation status check failed:', error)
      return {
        success: false,
        error: error.message,
        tokenId: tokenId,
        isRevoked: false
      }
    }
  }

  /**
   * Batch revoke certificates
   */
  async batchRevokeCertificates(tokenIds, reason, walletProvider) {
    const results = []
    
    for (const tokenId of tokenIds) {
      const result = await this.revokeCertificate(tokenId, reason, walletProvider)
      results.push(result)
      
      // Add delay between transactions to avoid nonce issues
      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    return results
  }

  /**
   * Generate revocation reasons
   */
  getRevocationReasons() {
    return [
      { value: 'fraud', label: 'Fraudulent Information' },
      { value: 'academic_misconduct', label: 'Academic Misconduct' },
      { value: 'incomplete_requirements', label: 'Incomplete Requirements' },
      { value: 'institutional_error', label: 'Institutional Error' },
      { value: 'student_request', label: 'Student Request' },
      { value: 'policy_violation', label: 'Policy Violation' },
      { value: 'technical_error', label: 'Technical Error' },
      { value: 'other', label: 'Other (Custom Reason)' }
    ]
  }

  /**
   * Validate revocation request
   */
  validateRevocationRequest(tokenId, reason) {
    const errors = []
    
    if (!tokenId || tokenId.toString().trim() === '') {
      errors.push('Certificate ID is required')
    }
    
    if (!reason || reason.trim() === '') {
      errors.push('Revocation reason is required')
    }
    
    if (reason && reason.length < 10) {
      errors.push('Revocation reason must be at least 10 characters')
    }
    
    if (reason && reason.length > 500) {
      errors.push('Revocation reason must be less than 500 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }
}

export default new RevocationService()
