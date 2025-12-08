/**
 * Blockchain Upload Utilities
 * Helper functions to upload certificate data to blockchain contracts
 */

import { prepareContractCall } from "thirdweb";

/**
 * Prepare a batch transaction for uploading certificates to blockchain
 * 
 * @param {Object} orgContract - The organization's smart contract instance
 * @param {Array} certificates - Array of certificate objects with blockchainData
 * @returns {Object} - Prepared transaction ready to be sent
 * 
 * @example
 * const certificates = [
 *   {
 *     blockchainData: {
 *       certID: "CERT-001",
 *       filePhash: "0x123...",
 *       dataHash: "0x000...",
 *       encryptedData: "0x0000"
 *     }
 *   }
 * ];
 * const transaction = prepareBatchCertificateUpload(orgContract, certificates);
 * sendTransaction(transaction);
 */
export function prepareBatchCertificateUpload(orgContract, certificates) {
  if (!orgContract) {
    throw new Error("Organization contract is required");
  }

  if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
    throw new Error("Certificates array is required and must not be empty");
  }

  // Extract blockchain data from certificates
  const certIDList = [];
  const filePhashList = [];
  const dataHashList = [];
  const encryptedDataList = [];

  for (const cert of certificates) {
    const { blockchainData } = cert;
    
    if (!blockchainData) {
      console.warn(`Certificate missing blockchainData:`, cert);
      continue;
    }

    certIDList.push(blockchainData.certID);
    filePhashList.push(blockchainData.filePhash);
    dataHashList.push(blockchainData.dataHash);
    encryptedDataList.push(blockchainData.encryptedData);
  }

  // Validate we have data to upload
  if (certIDList.length === 0) {
    throw new Error("No valid certificates with blockchain data found");
  }

  console.log("Preparing blockchain batch upload:", {
    certIDList,
    filePhashList,
    dataHashList,
    encryptedDataList,
  });

  // Prepare the contract call
  const transaction = prepareContractCall({
    contract: orgContract,
    method:
      "function issueCertificatesBatch(string[] certIDList, bytes32[] filePhashList, bytes32[] dataHashList, bytes[] encryptedDataList)",
    params: [certIDList, filePhashList, dataHashList, encryptedDataList],
  });

  return transaction;
}

/**
 * Prepare a single certificate upload transaction
 * 
 * @param {Object} orgContract - The organization's smart contract instance
 * @param {Object} certificate - Certificate object with blockchainData
 * @returns {Object} - Prepared transaction ready to be sent
 */
export function prepareSingleCertificateUpload(orgContract, certificate) {
  if (!orgContract) {
    throw new Error("Organization contract is required");
  }

  if (!certificate || !certificate.blockchainData) {
    throw new Error("Certificate with blockchainData is required");
  }

  const { blockchainData } = certificate;

  console.log("Preparing blockchain single certificate upload:", blockchainData);

  // Prepare the contract call for single certificate
  const transaction = prepareContractCall({
    contract: orgContract,
    method:
      "function issueCertificate(string certID, bytes32 filePhash, bytes32 dataHash, bytes encryptedData)",
    params: [
      blockchainData.certID,
      blockchainData.filePhash,
      blockchainData.dataHash,
      blockchainData.encryptedData,
    ],
  });

  return transaction;
}

/**
 * Upload certificates to blockchain and wait for confirmation
 * 
 * @param {Function} sendTransaction - The sendTransaction function from useSendTransaction hook
 * @param {Object} transaction - Prepared transaction object
 * @returns {Promise} - Promise that resolves when transaction succeeds or rejects on error
 */
export function uploadToBlockchain(sendTransaction, transaction) {
  return new Promise((resolve, reject) => {
    sendTransaction(transaction, {
      onSuccess: (result) => {
        console.log("Blockchain upload successful:", result);
        resolve(result);
      },
      onError: (error) => {
        console.error("Blockchain upload failed:", error);
        reject(error);
      },
    });
  });
}

/**
 * Validate blockchain data format
 * 
 * @param {Object} blockchainData - The blockchain data object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateBlockchainData(blockchainData) {
  if (!blockchainData) return false;

  const { certID, filePhash, dataHash, encryptedData } = blockchainData;

  // Check all required fields exist
  if (!certID || !filePhash || !dataHash || !encryptedData) {
    return false;
  }

  // Validate hash formats (should start with 0x and be hex)
  const bytes32Regex = /^0x[0-9a-fA-F]{64}$/;
  const bytesRegex = /^0x[0-9a-fA-F]+$/;

  if (!bytes32Regex.test(filePhash)) {
    console.error("Invalid filePhash format:", filePhash);
    return false;
  }

  if (!bytes32Regex.test(dataHash)) {
    console.error("Invalid dataHash format:", dataHash);
    return false;
  }

  if (!bytesRegex.test(encryptedData)) {
    console.error("Invalid encryptedData format:", encryptedData);
    return false;
  }

  return true;
}

const blockchainUploadUtils = {
  prepareBatchCertificateUpload,
  prepareSingleCertificateUpload,
  uploadToBlockchain,
  validateBlockchainData,
};

export default blockchainUploadUtils;
