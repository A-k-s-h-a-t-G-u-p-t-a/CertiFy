# Certificate Verifier 2 - Documentation

## Overview
The Verifier2 page provides a blockchain-based certificate verification system that integrates with a smart contract deployed on the Sepolia testnet.

## Features
- 🔐 **Blockchain Verification**: Verifies certificates directly on-chain
- 🖼️ **Perceptual Hashing**: Uses pHash to detect certificate tampering
- 🎨 **Clean UI**: Modern, responsive design with visual feedback
- 📊 **Detailed Results**: Shows verification codes, admin verification status, and hash comparisons

## Contract Details
- **Contract Address**: `0x25aF0a1fCC9188303aEcc9Df8D64a4093e3Bf6d5`
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Function**: `verifyCertificateView(string certID, bytes32 recomputedFilePhash, bytes32 recomputedDataHash)`

## Common pHash Utilities

The project includes a centralized pHash utility (`/src/utils/phash.js`) that can be used for both certificate generation and verification.

### Functions Available:

#### `computePHash(file)`
Computes the perceptual hash of an image file.
```javascript
import { computePHash } from '@/utils/phash';

const file = document.getElementById('file-input').files[0];
const phash = await computePHash(file);
// Returns: "0x0000..." (bytes32 format)
```

#### `computeDataHash(data)`
Computes SHA-256 hash of certificate data.
```javascript
import { computeDataHash } from '@/utils/phash';

const dataHash = await computeDataHash(certificateData);
// Returns: "0x0000..." (bytes32 format)
```

#### `computeEncryptionHash(data)`
Encrypts certificate metadata (placeholder for now).
```javascript
import { computeEncryptionHash } from '@/utils/phash';

const encrypted = await computeEncryptionHash(sensitiveData);
// Returns: "0x0000" (placeholder)
```

#### Helper Functions:
- `isValidBytes32(hash)` - Validates bytes32 format
- `toBytes32(hash)` - Converts and pads hash to bytes32 format
- `compareHashes(hash1, hash2)` - Compares two hashes for equality

## Verification Codes

The smart contract returns different verification codes:

| Code | Status | Description |
|------|--------|-------------|
| 0 | ❌ Error | Certificate not found or call failed |
| 1 | ✅ Verified | Exact file (pHash) & data (SHA-256) match |
| 2 | ⚠️ Partial Match | File pHash matches but data hash differs (possible metadata tamper) |
| 3 | ℹ️ Data Match | Data hash matches but file differs (likely scanned/re-exported copy) |
| 4 | ❌ Invalid | No match - certificate likely invalid or forged |
| 5 | 🚩 Flagged | Certificate flagged - admin review required |
| 6 | 🚫 Revoked | Certificate has been revoked |

## Usage

### For Verification:
1. Enter the Certificate ID
2. Upload the certificate file (PDF, PNG, or JPG)
3. Click "Verify Certificate"
4. Review the verification result

### For Certificate Issuance:
Use the same pHash utilities in your certificate generation code:

```javascript
import { computePHash, computeDataHash, computeEncryptionHash } from '@/utils/phash';

// Generate hashes
const filePhash = await computePHash(certificateFile);
const dataHash = await computeDataHash(certificateMetadata);
const encryptedData = await computeEncryptionHash(sensitiveInfo);

// Call smart contract
await contract.call("issueCertificate", [
  certificateId,
  filePhash,
  dataHash,
  encryptedData
]);
```

## Implementation Notes

### Current Status:
- ✅ UI complete and functional
- ✅ Blockchain integration ready
- ✅ Contract address configured
- ⏳ pHash computation (placeholder - returns 0x0000...)
- ⏳ Data hash computation (placeholder - returns 0x0000...)
- ⏳ Encryption (placeholder - returns 0x0000)

### TODO:
1. **Implement actual pHash computation**:
   - Use `imghash` or similar library
   - Process images to generate perceptual fingerprints
   - Ensure consistency across certificate generation and verification

2. **Implement SHA-256 hashing**:
   - Use Web Crypto API or crypto-js
   - Hash certificate metadata properly

3. **Implement encryption**:
   - Choose encryption algorithm (AES-256, etc.)
   - Secure key management
   - Encrypt sensitive certificate data

## Environment Variables

Add to your `.env.local`:
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
```

## Dependencies
- `thirdweb` - Blockchain interaction
- `lucide-react` - Icons
- `next` - Framework
- `react` - UI library

## File Structure
```
src/
├── app/
│   └── verifier2/
│       └── page.jsx          # Main verifier page
└── utils/
    └── phash.js              # Common pHash utilities
```

## Smart Contract Integration

The verifier calls the `verifyCertificateView` function which returns:
- `code` (uint8): Verification status code
- `message` (string): Human-readable verification message
- `adminMatch` (bool): Whether admin decrypted hash matches
- `storedFilePhash` (bytes32): pHash stored on blockchain
- `storedDataHash` (bytes32): Data hash stored on blockchain

## Testing

1. Ensure you have a wallet connected (MetaMask, etc.)
2. Switch to Sepolia testnet
3. Get test ETH from a Sepolia faucet
4. Use the verifier with a valid certificate ID from the contract

## Support

For issues or questions, please refer to:
- Smart contract documentation
- ThirdWeb documentation: https://portal.thirdweb.com/
- Project README
