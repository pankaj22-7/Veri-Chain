import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CertificateNFTModule = buildModule("CertificateNFTModule", (m) => {
  const certificateNFT = m.contract("CertificateNFT");

  return { certificateNFT };
});

export default CertificateNFTModule;