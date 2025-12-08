/**
 * Common Hash utility functions for certificate verification
 * Uses SHA-256 cryptographic hash for file fingerprinting
 */

/**
 * Compute SHA-256 cryptographic hash of a file
 * This creates a unique fingerprint of the file that changes if even a single byte is modified
 * 
 * @param {string} base64Data - The base64 encoded file data
 * @returns {Promise<string>} - The SHA-256 hash as a hex string (bytes32 format)
 */
export async function computeFileHash(base64Data) {
  try {
    // Convert base64 to binary
    const binaryString = atob(base64Data);
    
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Use Web Crypto API to compute SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    
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
const hashUtils = {
  computeFileHash,
  getZeroDataHash,
  getZeroEncryption,
  isValidBytes32,
  compareHashes,
};

export default hashUtils;
