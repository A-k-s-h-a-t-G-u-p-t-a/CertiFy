/**
 * Common Hash utility functions for certificate verification
 * Uses SHA-256 cryptographic hash for file fingerprinting
 */

/**
 * Compute SHA-256 cryptographic hash of a file
 * This creates a unique fingerprint of the file that changes if even a single byte is modified
 * 
 * @param {File|Blob} file - The file to hash
 * @returns {Promise<string>} - The SHA-256 hash as a hex string (bytes32 format)
 */
export async function computeFileHash(file) {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use Web Crypto API to compute SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return as bytes32 format (0x + 64 hex characters)
    return '0x' + hashHex;
  } catch (error) {
    console.error('Error computing file hash:', error);
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
}

/**
 * Placeholder for data hash - returns zero hash as requested
 * 
 * @returns {string} - Zero bytes32 hash
 */
export function getZeroDataHash() {
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

/**
 * Placeholder for encryption - returns zero as requested
 * 
 * @returns {string} - Zero encryption value
 */
export function getZeroEncryption() {
  return "0x0000";
}

/**
 * Validate if a hash string is in proper bytes32 format
 * 
 * @param {string} hash - The hash string to validate
 * @returns {boolean} - True if valid bytes32 format
 */
export function isValidBytes32(hash) {
  if (!hash) return false;
  const regex = /^0x[0-9a-fA-F]{64}$/;
  return regex.test(hash);
}

/**
 * Compare two hashes for equality
 * 
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {boolean} - True if hashes are identical
 */
export function compareHashes(hash1, hash2) {
  if (!hash1 || !hash2) return false;
  return hash1.toLowerCase() === hash2.toLowerCase();
}

// Export default object with all functions
export default {
  computeFileHash,
  getZeroDataHash,
  getZeroEncryption,
  isValidBytes32,
  compareHashes,
};
