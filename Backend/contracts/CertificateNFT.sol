// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import secure, standard contracts from the OpenZeppelin library we just installed
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Our contract is defined as an NFT (ERC721) and is Ownable
// "Ownable" means only the creator of the contract can perform certain actions
contract CertificateNFT is ERC721, Ownable {
    // A counter to ensure every NFT gets a unique ID
    uint256 private _nextTokenId;

    // A custom data structure to hold the information for each certificate
    struct Certificate {
        string studentName;
        string degreeName;
        uint256 issueDate;
    }

    // A mapping (like a dictionary) to link a unique token ID to its certificate details
    mapping(uint256 => Certificate) private _certificateDetails;

    // This is the constructor. It runs once when the contract is deployed.
    // It sets the name ("VeriChainCertificate") and symbol ("VCC") for our NFT collection.
    constructor() ERC721("VeriChainCertificate", "VCC") Ownable(msg.sender) {}

    /**
     * @dev This is the function to issue a new certificate.
     * It can only be called by the contract "Owner" (the university).
     * It creates (mints) a new NFT and assigns it to a student's wallet address.
     */
    function issueCertificate(address student, string memory studentName, string memory degreeName) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(student, tokenId); // This line creates the actual NFT
        
        // Store the details for this new NFT
        _certificateDetails[tokenId] = Certificate({
            studentName: studentName,
            degreeName: degreeName,
            issueDate: block.timestamp // Records the exact date and time of issuance
        });
    }

    /**
     * @dev This function retrieves the details for a given certificate NFT.
     * It is a "view" function, meaning it's free to call and anyone can do it to verify.
     */
    function getCertificateDetails(uint256 tokenId) public view returns (Certificate memory) {
        // FIXED: Use _ownerOf instead of _isMinted
        require(_ownerOf(tokenId) != address(0), "Certificate NFT does not exist");
        return _certificateDetails[tokenId];
    }
}
