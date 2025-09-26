import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

class IPFSService {
  constructor() {
    console.log('🔧 IPFS Service initialized');
    console.log('📋 API Key exists:', !!PINATA_API_KEY);
    console.log('🔑 Secret Key exists:', !!PINATA_SECRET_KEY);
    
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.error('❌ Missing Pinata credentials in environment variables');
    }
  }

  // Upload file to IPFS and get hash
  async uploadFile(file, metadata = {}) {
    console.log('📤 Starting IPFS upload for file:', file.name);
    
    try {
      // Check if credentials exist
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error('Pinata API credentials not configured. Please check your .env file.');
      }

      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      const pinataMetadata = JSON.stringify({
        name: metadata.name || file.name,
        keyvalues: {
          certificateId: metadata.certificateId || '',
          studentName: metadata.studentName || '',
          institutionName: metadata.institutionName || '',
          uploadDate: new Date().toISOString(),
          ...metadata
        }
      });
      formData.append('pinataMetadata', pinataMetadata);

      // Add options
      const pinataOptions = JSON.stringify({
        cidVersion: 0,
        wrapWithDirectory: false
      });
      formData.append('pinataOptions', pinataOptions);

      console.log('🚀 Sending request to Pinata...');
      
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('✅ IPFS upload successful!', response.data);

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp
      };
    } catch (error) {
      console.error('❌ IPFS Upload Error:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        // Server responded with error status
        console.error('Response error:', error.response.data);
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Request made but no response
        console.error('Request error:', error.request);
        errorMessage = 'Network error: Unable to reach Pinata servers. Please check your internet connection.';
      } else {
        // Something else happened
        console.error('General error:', error.message);
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Get file URL from IPFS hash
  getFileUrl(ipfsHash) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  // Test connection to Pinata
  async testConnection() {
    console.log('🔍 Testing Pinata connection...');
    
    try {
      // Check if credentials exist
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        console.error('❌ Missing credentials');
        return { 
          success: false, 
          error: 'Missing Pinata API credentials. Please check your .env file.' 
        };
      }

      const response = await axios.get(
        'https://api.pinata.cloud/data/testAuthentication',
        {
          headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('✅ Pinata connection successful!', response.data);
      return { 
        success: true, 
        message: response.data.message || 'Connected to Pinata IPFS' 
      };
    } catch (error) {
      console.error('❌ Pinata connection failed:', error);
      
      let errorMessage = 'Connection test failed';
      
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          errorMessage = 'Invalid Pinata API credentials. Please check your API key and secret.';
        } else {
          errorMessage = error.response.data?.error || 
                        error.response.data?.message || 
                        `HTTP ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach Pinata servers.';
      } else {
        errorMessage = error.message;
      }

      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  // Get account info (to verify connection)
  async getAccountInfo() {
    try {
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        throw new Error('Missing Pinata credentials');
      }

      const response = await axios.get(
        'https://api.pinata.cloud/data/userPinnedDataTotal',
        {
          headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
          },
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new IPFSService();
