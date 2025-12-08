/**
 * EXAMPLE: How to use blockchain upload utilities
 * 
 * This example shows how to integrate certificate generation with blockchain upload
 * Copy and adapt this code to your actual component
 */

import { useState } from "react";
import { useSendTransaction } from "thirdweb/react";
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "@/lib/client";
import {
  prepareBatchCertificateUpload,
  uploadToBlockchain,
  validateBlockchainData,
} from "@/lib/blockchain-upload";

export default function CertificateUploadExample() {
  const { mutate: sendTransaction } = useSendTransaction();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Your organization contract address (get this from your organization data)
  const ORG_CONTRACT_ADDRESS = "0xYourContractAddressHere";

  // Create contract instance
  const orgContract = getContract({
    client,
    chain: defineChain(11155111), // Sepolia testnet
    address: ORG_CONTRACT_ADDRESS,
  });

  /**
   * Step 1: Generate certificates using the API
   * Step 2: Upload the generated certificates to blockchain
   */
  const handleCertificateGeneration = async (certificateData) => {
    try {
      setIsUploading(true);
      setUploadStatus("Generating certificates...");

      // Step 1: Call the certificate generation API
      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificates: certificateData, // Array of certificate data
          additionalImage: null, // Optional: base64 image
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error("Certificate generation failed");
      }

      console.log("Certificates generated:", result.certificates);

      // Step 2: Validate blockchain data
      setUploadStatus("Validating blockchain data...");
      const validCertificates = result.certificates.filter((cert) =>
        validateBlockchainData(cert.blockchainData)
      );

      if (validCertificates.length === 0) {
        throw new Error("No valid certificates for blockchain upload");
      }

      console.log(`${validCertificates.length} certificates ready for blockchain`);

      // Step 3: Prepare blockchain transaction
      setUploadStatus("Preparing blockchain transaction...");
      const transaction = prepareBatchCertificateUpload(
        orgContract,
        validCertificates
      );

      // Step 4: Upload to blockchain
      setUploadStatus("Uploading to blockchain (please confirm in wallet)...");
      await uploadToBlockchain(sendTransaction, transaction);

      setUploadStatus("✅ Successfully uploaded to blockchain!");

      // Step 5: Save to database (your API call here)
      await saveCertificatesToDatabase(result.certificates);

      console.log("All done!");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Save certificates to database after blockchain upload
   */
  const saveCertificatesToDatabase = async (certificates) => {
    const response = await fetch("/api/certificates/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificates }),
    });

    if (!response.ok) {
      throw new Error("Failed to save certificates to database");
    }

    return response.json();
  };

  /**
   * Example: Upload single certificate
   */
  const handleSingleCertificate = async () => {
    const certificateData = {
      name: "John Doe",
      certificateId: "CERT-2025-001",
      courseName: "Blockchain Development",
      year: "2025",
      organisation: "My Organization",
      organisationId: "ORG-001",
    };

    await handleCertificateGeneration([certificateData]);
  };

  /**
   * Example: Upload multiple certificates from CSV/Excel
   */
  const handleBatchUpload = async (csvData) => {
    // csvData is already parsed array of objects
    await handleCertificateGeneration(csvData);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Certificate Upload Example</h2>

      <div className="space-y-4">
        <button
          onClick={handleSingleCertificate}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Upload Single Certificate
        </button>

        <div className="mt-4">
          <p className="font-semibold">Status:</p>
          <p className="text-sm">{uploadStatus || "Ready"}</p>
        </div>
      </div>

      {/* Example code display */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Example Usage:</h3>
        <pre className="text-xs overflow-auto">
          {`
// 1. Generate certificates with blockchain data
const response = await fetch("/api/certificate/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    certificates: [
      {
        name: "John Doe",
        certificateId: "CERT-001",
        courseName: "Course Name",
        // ... other fields
      }
    ]
  })
});

const result = await response.json();

// 2. Prepare blockchain transaction
const transaction = prepareBatchCertificateUpload(
  orgContract, 
  result.certificates
);

// 3. Send to blockchain
await uploadToBlockchain(sendTransaction, transaction);

// 4. Save to database
await saveToDB(result.certificates);
          `}
        </pre>
      </div>
    </div>
  );
}
