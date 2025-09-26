import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

class SimpleIPFSService {
  // Upload file to IPFS and get hash
  async uploadFile(file, fileName) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      const metadata = JSON.stringify({
        name: fileName || file.name,
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
          },
        }
      );

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };
    } catch (error) {
      console.error('IPFS Upload Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get file URL from IPFS hash
  getFileUrl(ipfsHash) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  // Test connection
  async testConnection() {
    try {
      const response = await axios.get(
        'https://api.pinata.cloud/data/testAuthentication',
        {
          headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
          },
        }
      );
      return { success: true, message: 'Connected to Pinata' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new SimpleIPFSService();
