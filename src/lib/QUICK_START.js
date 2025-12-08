/**
 * QUICK START GUIDE - Blockchain Certificate Upload
 * 
 * This file shows the exact steps to integrate blockchain upload
 * into your existing certificate upload flow.
 */

// ============================================
// STEP 1: Import Required Dependencies
// ============================================
import { useSendTransaction } from "thirdweb/react";
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "@/lib/client";
import { prepareBatchCertificateUpload, uploadToBlockchain } from "@/lib/blockchain-upload";

// ============================================
// STEP 2: Setup in Your Component
// ============================================
export function YourUploadComponent() {
  const { mutate: sendTransaction } = useSendTransaction();
  
  // Get your organization contract address from your org data
  const orgContractAddress = "0xYourOrgContractAddress"; // From database or session
  
  const orgContract = getContract({
    client,
    chain: defineChain(11155111), // Sepolia testnet
    address: orgContractAddress,
  });

  // ============================================
  // STEP 3: Upload Workflow
  // ============================================
  const handleUpload = async (csvData) => {
    try {
      // 3.1: Generate Certificates (computes hash automatically)
      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificates: csvData, // Your parsed CSV data
          additionalImage: null, // Optional org logo
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error("Certificate generation failed");
      }
      
      console.log("✅ Certificates generated:", result.certificates.length);
      
      // 3.2: Prepare Blockchain Transaction
      const transaction = prepareBatchCertificateUpload(
        orgContract,
        result.certificates
      );
      
      console.log("📝 Transaction prepared");
      
      // 3.3: Upload to Blockchain
      console.log("⏳ Please confirm transaction in wallet...");
      await uploadToBlockchain(sendTransaction, transaction);
      
      console.log("✅ Uploaded to blockchain!");
      
      // 3.4: Save to Database
      const saveResponse = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificates: result.certificates,
          organisationId: yourOrgId,
        }),
      });
      
      if (!saveResponse.ok) {
        throw new Error("Database save failed");
      }
      
      console.log("✅ Saved to database!");
      
      alert("All certificates uploaded successfully!");
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  return (
    <button onClick={() => handleUpload(yourData)}>
      Upload Certificates
    </button>
  );
}

// ============================================
// WHAT HAPPENS BEHIND THE SCENES
// ============================================

/*
1. Your CSV data → API endpoint
   Example: [{ Name: "John", CertificateId: "C001", ... }]

2. API generates image and computes hash
   - Creates canvas with certificate
   - Converts to base64: "data:image/png;base64,iVBORw0KG..."
   - Extracts base64 data: "iVBORw0KG..."
   - Computes SHA-256 hash: "0x1234...abcd"
   - Uploads to Cloudinary

3. API returns blockchain-ready data
   {
     url: "https://cloudinary.com/...",
     fileHash: "0x1234...abcd",
     blockchainData: {
       certID: "C001",
       filePhash: "0x1234...abcd",
       dataHash: "0x0000...0000",
       encryptedData: "0x0000"
     }
   }

4. Client prepares contract call
   prepareContractCall({
     contract: orgContract,
     method: "issueCertificatesBatch(...)",
     params: [
       ["C001", "C002", ...],           // certIDList
       ["0x1234...", "0x5678...", ...], // filePhashList
       ["0x0000...", "0x0000...", ...], // dataHashList
       ["0x0000", "0x0000", ...]        // encryptedDataList
     ]
   })

5. User signs transaction in wallet
   MetaMask/WalletConnect popup appears

6. Transaction confirmed on blockchain
   Certificate hashes are now immutable on-chain

7. Save certificate records to database
   Including blockchain transaction hash
*/

// ============================================
// INTEGRATION WITH EXISTING CODE
// ============================================

// If you already have this pattern:
/*
const results = await fetch("/api/certificate/generate", {
  method: "POST",
  body: JSON.stringify({ certificates })
});

const certs = await results.json();

// Add blockchain upload here:
const transaction = prepareBatchCertificateUpload(orgContract, certs.certificates);
await uploadToBlockchain(sendTransaction, transaction);
*/

// ============================================
// RESPONSE STRUCTURE
// ============================================

/*
From API (single certificate):
{
  success: true,
  url: "https://res.cloudinary.com/...",
  publicId: "certificates/abc123",
  fileHash: "0x1234567890abcdef...",
  dataHash: "0x0000000000000000...",
  encryptedData: "0x0000",
  blockchainData: {
    certID: "CERT-001",
    filePhash: "0x1234567890abcdef...",
    dataHash: "0x0000000000000000...",
    encryptedData: "0x0000"
  }
}

From API (batch):
{
  success: true,
  totalRequested: 100,
  successfulCount: 100,
  certificates: [
    { ...certificate1WithBlockchainData },
    { ...certificate2WithBlockchainData },
    ...
  ]
}
*/

// ============================================
// COMMON PATTERNS
// ============================================

// Pattern 1: Upload with progress tracking
async function uploadWithProgress(certificates) {
  const total = certificates.length;
  
  for (let i = 0; i < total; i++) {
    console.log(`Processing ${i + 1}/${total}...`);
    // Process in batches if needed
  }
}

// Pattern 2: Upload with error handling
async function uploadWithRetry(certificates) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      await uploadToBlockchain(sendTransaction, transaction);
      break;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s
    }
  }
}

// Pattern 3: Validate before upload
import { validateBlockchainData } from "@/lib/blockchain-upload";

const validCerts = certificates.filter(cert => 
  validateBlockchainData(cert.blockchainData)
);

if (validCerts.length !== certificates.length) {
  console.warn(`${certificates.length - validCerts.length} invalid certificates`);
}
