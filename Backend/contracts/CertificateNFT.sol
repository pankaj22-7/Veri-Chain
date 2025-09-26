// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CertificateNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Certificate {
        string studentName;
        string degreeName;
        uint256 issueDate;
        string ipfsHash;
        address issuer;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => bool) public authorizedInstitutions;
    
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        string studentName,
        string degreeName,
        string ipfsHash,
        address indexed issuer
    );

    constructor() ERC721("VeriChain Certificate", "VCERT") {}

    modifier onlyAuthorized() {
        require(authorizedInstitutions[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function authorizeInstitution(address institution) external onlyOwner {
        authorizedInstitutions[institution] = true;
    }

    function revokeInstitution(address institution) external onlyOwner {
        authorizedInstitutions[institution] = false;
    }

    function issueCertificate(
        address recipient,
        string memory studentName,
        string memory degreeName,
        string memory ipfsHash
    ) external onlyAuthorized returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(studentName).length > 0, "Student name required");
        require(bytes(degreeName).length > 0, "Degree name required");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(recipient, newTokenId);

        certificates[newTokenId] = Certificate({
            studentName: studentName,
            degreeName: degreeName,
            issueDate: block.timestamp,
            ipfsHash: ipfsHash,
            issuer: msg.sender
        });

        emit CertificateIssued(
            newTokenId,
            recipient,
            studentName,
            degreeName,
            ipfsHash,
            msg.sender
        );

        return newTokenId;
    }

    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }

    function verifyCertificate(uint256 tokenId) external view returns (
        bool exists,
        string memory studentName,
        string memory degreeName,
        uint256 issueDate,
        string memory ipfsHash,
        address issuer,
        address owner
    ) {
        if (!_exists(tokenId)) {
            return (false, "", "", 0, "", address(0), address(0));
        }

        Certificate memory cert = certificates[tokenId];
        return (
            true,
            cert.studentName,
            cert.degreeName,
            cert.issueDate,
            cert.ipfsHash,
            cert.issuer,
            ownerOf(tokenId)
        );
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }
}
