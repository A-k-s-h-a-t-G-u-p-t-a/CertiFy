# Blockchain Certificate Upload Integration

This implementation adds blockchain integration to the certificate generation process, computing file hashes and preparing data for smart contract upload.

## 📋 Overview

The system now:

1. **Generates certificates** with canvas rendering
2. **Computes SHA-256 file hash** using the `computeFileHash` function from `phash.js`
3. **Prepares blockchain-ready data** for smart contract upload
4. **Returns all necessary parameters** for the `issueCertificatesBatch` contract function

## 🔧 Changes Made

### 1. Modified `route.js` (API Route)

**Location:** `src/app/api/certificate/generate/route.js`

**Changes:**

- Imported `computeFileHash`, `getZeroDataHash`, `getZeroEncryption` from `@/utils/phash`
- Computes file hash right after canvas generation
- Prepares blockchain data structure
- Returns `blockchainData` object with all contract parameters

**Response Structure:**

```json
{
  "success": true,
  "certificates": [
    {
      "url": "https://cloudinary.com/...",
      "publicId": "certificates/xyz",
      "fileHash": "0x1234...abcd",
      "dataHash": "0x0000...0000",
      "encryptedData": "0x0000",
      "blockchainData": {
        "certID": "CERT-001",
        "filePhash": "0x1234...abcd",
        "dataHash": "0x0000...0000",
        "encryptedData": "0x0000"
      }
    }
  ]
}
```

### 2. Created `blockchain-upload.js` Utility

**Location:** `src/lib/blockchain-upload.js`

**Functions:**

- `prepareBatchCertificateUpload(orgContract, certificates)` - Prepares batch transaction
- `prepareSingleCertificateUpload(orgContract, certificate)` - Prepares single transaction
- `uploadToBlockchain(sendTransaction, transaction)` - Executes blockchain upload
- `validateBlockchainData(blockchainData)` - Validates data format

### 3. Created Example Implementation

**Location:** `src/lib/blockchain-upload-example.jsx`

Demonstrates complete workflow from certificate generation to blockchain upload.

## 🚀 Usage

### Option 1: Batch Upload (Recommended)

```javascript
import { useSendTransaction } from "thirdweb/react";
import {
  prepareBatchCertificateUpload,
  uploadToBlockchain,
} from "@/lib/blockchain-upload";

function MyComponent() {
  const { mutate: sendTransaction } = useSendTransaction();

  const uploadCertificates = async (certificateData) => {
    // Step 1: Generate certificates
    const response = await fetch("/api/certificate/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificates: certificateData }),
    });

    const result = await response.json();

    // Step 2: Prepare blockchain transaction
    const transaction = prepareBatchCertificateUpload(
      orgContract,
      result.certificates
    );

    // Step 3: Upload to blockchain
    await uploadToBlockchain(sendTransaction, transaction);

    // Step 4: Save to database
    // ... your database save logic
  };
}
```

### Option 2: Single Certificate Upload

```javascript
const uploadSingleCertificate = async (certData) => {
  // Generate certificate
  const response = await fetch("/api/certificate/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(certData),
  });

  const result = await response.json();

  // Prepare and send transaction
  const transaction = prepareSingleCertificateUpload(orgContract, result);

  await uploadToBlockchain(sendTransaction, transaction);
};
```

## 📊 Data Flow

```
1. User submits certificate data
   ↓
2. API generates certificate image (Canvas)
   ↓
3. Compute file hash from base64 (SHA-256)
   ↓
4. Upload image to Cloudinary
   ↓
5. Return certificate with blockchain data
   ↓
6. Client prepares contract transaction
   ↓
7. User confirms wallet transaction
   ↓
8. Certificate uploaded to blockchain
   ↓
9. Save certificate record to database
```

## 🔐 Hash Types

### File Hash (`filePhash`)

- **Source:** SHA-256 hash of the certificate image
- **Format:** `bytes32` (0x + 64 hex characters)
- **Purpose:** Cryptographic fingerprint of the file
- **Example:** `0x1234567890abcdef...`

### Data Hash (`dataHash`)

- **Current:** Zero hash placeholder
- **Format:** `bytes32`
- **Future:** Hash of certificate metadata
- **Example:** `0x0000000000000000...`

### Encrypted Data (`encryptedData`)

- **Current:** Zero bytes placeholder
- **Format:** `bytes` (0x + hex)
- **Future:** Encrypted certificate information
- **Example:** `0x0000`

## 🎯 Smart Contract Function

The prepared data is compatible with this contract function:

```solidity
function issueCertificatesBatch(
    string[] certIDList,
    bytes32[] filePhashList,
    bytes32[] dataHashList,
    bytes[] encryptedDataList
)
```

## ✅ Validation

The system validates:

- ✓ File hash is proper `bytes32` format (0x + 64 hex chars)
- ✓ Data hash is proper `bytes32` format
- ✓ Encrypted data is proper `bytes` format (0x + hex)
- ✓ Certificate ID exists and is not empty

## 🔄 Integration Points

### Current File Structure

```
src/
├── app/api/certificate/generate/
│   └── route.js                    ← Modified (computes hash)
├── lib/
│   ├── blockchain-upload.js        ← New (utilities)
│   ├── blockchain-upload-example.jsx ← New (example)
│   └── client.ts                   ← Existing (contract config)
└── utils/
    └── phash.js                     ← Existing (hash functions)
```

### Integration with Existing Upload Page

Your existing `upload-certificates/page.jsx` can be updated to use these utilities:

```javascript
// Replace manual array building with utility function
import { prepareBatchCertificateUpload } from "@/lib/blockchain-upload";

// Instead of:
const certIDList = validCerts.map((c) => c.certificateId);
const filePhashList = validCerts.map((c) => "0x" + c.pHash.padStart(64, "0"));
// ...

// Use:
const transaction = prepareBatchCertificateUpload(orgContract, validCerts);
```

## 🐛 Troubleshooting

### Issue: "fileHash is undefined"

- Ensure the API route is returning `fileHash` in the response
- Check that `computeFileHash` is being awaited

### Issue: "Invalid bytes32 format"

- Hash must start with "0x" and be exactly 66 characters
- Use `validateBlockchainData()` to check format

### Issue: "Transaction failed"

- Ensure wallet is connected
- Check contract address is correct
- Verify you have sufficient gas

## 📝 Notes

1. **Server vs Client**: Hash computation happens server-side (API route), but blockchain upload must happen client-side (wallet signature required)

2. **Batch Processing**: The system is optimized for batch uploads - use `issueCertificatesBatch` for multiple certificates

3. **Gas Optimization**: Batch uploads are more gas-efficient than individual transactions

4. **Security**: File hash is cryptographic (SHA-256), ensuring tamper detection

## 🔜 Future Enhancements

- [ ] Implement actual data hash from certificate metadata
- [ ] Add encryption for sensitive certificate data
- [ ] Support for different hash algorithms
- [ ] Automatic retry on blockchain upload failure
- [ ] Progress tracking for large batches

## 📚 Related Files

- `src/utils/phash.js` - Hash computation functions
- `src/lib/client.ts` - Thirdweb client configuration
- `src/app/upload-certificates/page.jsx` - Example usage
- `contract/CertiFy.sol` - Smart contract (if available)
