/**
 * Client-side Steganography utility for extracting hidden data from certificate images
 * Uses LSB (Least Significant Bit) encoding in RED CHANNEL ONLY to hide/extract messages
 * 
 * Embedding format (matches /api/certificate/generate):
 * - First 32 pixels: Length of data stored in LSB of red channel (32 bits)
 * - Remaining pixels: Data characters (8 bits each) stored in LSB of red channel
 * - Each pixel's red channel (index i*4) holds 1 bit of data
 */

/**
 * Extract hidden steganographic message from an image
 * @param {HTMLCanvasElement} canvas - Canvas element with the loaded image
 * @returns {string|null} - Extracted message or null if extraction failed
 */
export function extractSteganography(canvas) {
  try {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    
    console.log(`Steganography: Image size ${width}x${height}, total pixels: ${pixels.length / 4}`);
    
    // Read first 32 bits for message length from RED channel only
    // Each pixel's red channel is at index i * 4
    let lengthBinary = '';
    for (let i = 0; i < 32; i++) {
      const pixelIndex = i * 4; // Red channel of pixel i
      lengthBinary += (pixels[pixelIndex] & 1).toString();
    }
    
    const length = parseInt(lengthBinary, 2);
    console.log(`Steganography: Extracted length indicator: ${length} (binary: ${lengthBinary.substring(0, 16)}...)`);
    
    // Validate length - prevent reading garbage data
    if (length <= 0 || length > 100000) {
      console.log("Steganography: No valid hidden data found (length out of bounds)");
      return null;
    }
    
    // Check if we have enough pixels to read the message
    const totalPixels = pixels.length / 4;
    const pixelsNeeded = 32 + (length * 8); // 32 for length + 8 bits per character
    if (pixelsNeeded > totalPixels) {
      console.log(`Steganography: Message length (${length}) exceeds available pixels (need ${pixelsNeeded}, have ${totalPixels})`);
      return null;
    }
    
    // Read the actual message from RED channel starting at pixel 32
    let binaryData = '';
    const bitsToRead = length * 8;
    for (let i = 0; i < bitsToRead; i++) {
      const pixelIndex = (32 + i) * 4; // Red channel of pixel 32, 33, 34...
      if (pixelIndex >= pixels.length) break;
      binaryData += (pixels[pixelIndex] & 1).toString();
    }
    
    console.log(`Steganography: Read ${binaryData.length} bits of data`);
    
    // Convert binary to characters
    const chars = [];
    for (let i = 0; i < binaryData.length; i += 8) {
      const byte = binaryData.slice(i, i + 8);
      if (byte.length === 8) {
        const charCode = parseInt(byte, 2);
        chars.push(String.fromCharCode(charCode));
      }
    }
    
    const extractedMessage = chars.join('');
    console.log(`Steganography: Extracted message length: ${extractedMessage.length}`);
    console.log(`Steganography: First 100 chars: ${extractedMessage.substring(0, 100)}...`);
    
    return extractedMessage || null;
  } catch (error) {
    console.error("Steganography extraction error:", error);
    return null;
  }
}

/**
 * Extract steganographic data from an image file
 * @param {File} file - Image file to extract data from
 * @returns {Promise<{success: boolean, encryptedData: string|null, error: string|null}>}
 */
export async function extractFromImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Extract hidden data
          const extractedData = extractSteganography(canvas);
          
          if (extractedData) {
            resolve({
              success: true,
              encryptedData: extractedData,
              error: null
            });
          } else {
            resolve({
              success: false,
              encryptedData: null,
              error: "No hidden steganographic data found in the image"
            });
          }
        } catch (error) {
          resolve({
            success: false,
            encryptedData: null,
            error: error.message
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          encryptedData: null,
          error: "Failed to load image"
        });
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        encryptedData: null,
        error: "Failed to read file"
      });
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compute SHA-256 hash of a string (for comparing with blockchain data hash)
 * @param {string} data - String data to hash (JSON string from steganography)
 * @returns {Promise<string>} - Hash in bytes32 format (0x...)
 */
export async function computeDataHash(data) {
  try {
    // Parse the JSON string if it's a valid JSON object
    let jsonString = data;
    try {
      const parsedData = JSON.parse(data);
      // Re-stringify with sorted keys to match server-side computation
      jsonString = JSON.stringify(parsedData, Object.keys(parsedData).sort());
    } catch (e) {
      // If not valid JSON, use the string as-is
      jsonString = data;
    }
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hashHex;
  } catch (error) {
    console.error('Error computing data hash:', error);
    return null;
  }
}

/**
 * Compare extracted steganographic data hash with blockchain stored data hash
 * @param {string} extractedEncryptedData - Encrypted data extracted from image
 * @param {string} storedDataHash - Data hash stored on blockchain (bytes32)
 * @returns {Promise<{matches: boolean, extractedHash: string|null, storedHash: string, details: string}>}
 */
export async function verifySteganographicData(extractedEncryptedData, storedDataHash) {
  // If no data was extracted
  if (!extractedEncryptedData) {
    return {
      matches: false,
      extractedHash: null,
      storedHash: storedDataHash,
      details: "No steganographic data found in the certificate image"
    };
  }
  
  // If stored hash is zero (no data hash stored on blockchain)
  const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (storedDataHash === zeroHash || !storedDataHash) {
    return {
      matches: false,
      extractedHash: null,
      storedHash: storedDataHash || zeroHash,
      details: "No data hash stored on blockchain for comparison (certificate may not have steganographic verification enabled)"
    };
  }
  
  // Compute hash of extracted encrypted data
  const extractedHash = await computeDataHash(extractedEncryptedData);
  
  if (!extractedHash) {
    return {
      matches: false,
      extractedHash: null,
      storedHash: storedDataHash,
      details: "Failed to compute hash of extracted steganographic data"
    };
  }
  
  // Compare hashes
  const matches = extractedHash.toLowerCase() === storedDataHash.toLowerCase();
  
  return {
    matches,
    extractedHash,
    storedHash: storedDataHash,
    details: matches 
      ? "✓ Steganographic data hash matches blockchain record - Certificate integrity verified!" 
      : "✗ Steganographic data hash does NOT match blockchain record - Certificate may have been tampered with!"
  };
}

export default {
  extractSteganography,
  extractFromImageFile,
  computeDataHash,
  verifySteganographicData
};
