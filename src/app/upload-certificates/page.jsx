"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Shield, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { useActiveAccount, useSendTransaction, useReadContract } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "@/lib/client";

export default function UploadCertificatesPage() {
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState(null);

  // Blockchain State
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  const [orgContract, setOrgContract] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Fetch Organization Contract (Reuse logic from Org.jsx)
  useEffect(() => {
    const fetchOrganization = async () => {
      if (account?.address) {
        try {
          const response = await fetch(`/api/organizations?wallet=${account.address}`);
          const data = await response.json();
          if (data.success && data.organization && data.organization.contractAddress) {
            setOrgContract(getContract({
              client,
              chain: defineChain(11155111),
              address: data.organization.contractAddress,
            }));
          }
        } catch (error) {
          console.error("Error fetching organization:", error);
        }
      }
    };
    fetchOrganization();
  }, [account?.address]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel") {
        setFile(selectedFile);
        setError("");
        setParsedData(null); // Reset parsed data when new file is selected
      } else {
        setError("Please select a valid Excel file (.xlsx or .xls)");
        setFile(null);
        setParsedData(null);
      }
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove the data:application/... prefix
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError("");
    setResults(null);

    try {
      // Parse Excel file to JSON
      console.log("Parsing Excel file...");
      const excelData = await parseExcelFile(file);

      if (!excelData || excelData.length === 0) {
        throw new Error("Excel file is empty or could not be parsed");
      }

      console.log("Parsed Excel data:", excelData);
      setParsedData(excelData); // Store parsed data for preview

      // Send parsed data directly to uploadxl-simple endpoint
      const response = await fetch("/api/uploadxl-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificates: excelData // Send as certificates array
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResults(data);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError("An error occurred during upload: " + err.message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeployToBlockchain = async () => {
    if (!orgContract || !results?.certificates) return;

    setIsDeploying(true);
    setDeploySuccess(false);

    try {
      console.log("Handle Deploy - Results:", results);
      if (!results?.certificates) {
        console.error("No certificates in results");
        return;
      }

      const validCerts = results.certificates.filter(c => {
        const isValid = c.pHash && c.certificateHash && c.encryptedHash;
        if (!isValid) console.warn("Invalid cert (missing hashes):", c);
        return isValid;
      });

      console.log("Valid Certificates Count:", validCerts.length);

      if (validCerts.length === 0) {
        throw new Error("No valid certificates found to deploy. Please re-upload the file to generate hashes.");
      }

      const certIDList = validCerts.map(c => c.certificateId);
      const filePhashList = validCerts.map(c => '0x' + c.pHash.padStart(64, '0'));
      const dataHashList = validCerts.map(c => '0x' + c.certificateHash);
      const encryptedDataList = validCerts.map(c => '0x' + c.encryptedHash.replace(':', ''));

      console.log("Deploying batch:", { certIDList, filePhashList, dataHashList, encryptedDataList });

      const transaction = prepareContractCall({
        contract: orgContract,
        method: "function issueCertificatesBatch(string[] certIDList, bytes32[] filePhashList, bytes32[] dataHashList, bytes[] encryptedDataList)",
        params: [certIDList, filePhashList, dataHashList, encryptedDataList],
      });

      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Batch deployment successful:", result);
            setDeploySuccess(true);
            resolve(result);
          },
          onError: (error) => {
            console.error("Batch deployment failed:", error);
            reject(error);
          }
        });
      });

    } catch (err) {
      console.error("Deployment error:", err);
      // Don't override general error state, maybe just alert or console
      alert("Blockchain deployment failed: " + err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Upload Certificates from Excel
        </h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Select Excel File
            </h2>
            <p className="text-gray-600 mb-6">
              Upload an Excel file containing certificate data. The file should include columns for:
              <br />
              <strong>Name, Certificate ID, Course Name, Course ID, Year, APAAR ID</strong>
            </p>

            <div className="mb-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="cursor-pointer inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose Excel File
              </label>
            </div>

            {file && (
              <div className="text-sm text-gray-600 mb-4">
                Selected: {file.name}
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center text-red-600 mb-4">
                <XCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`px-8 py-3 rounded-lg font-semibold transition-colors ${!file || uploading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                "Upload & Generate Certificates"
              )}
            </button>
          </div>
        </div>

        {/* Parsed Data Preview */}
        {parsedData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Excel Data Preview ({parsedData.length} rows)
            </h2>
            <div className="max-h-96 overflow-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {parsedData.length > 0 && Object.keys(parsedData[0]).map((key) => (
                      <th key={key} className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((row, index) => ( // Show first 10 rows
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={valueIndex} className="border border-gray-300 px-2 py-1 text-xs">
                          {String(value || "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <p className="text-gray-600 text-sm mt-2">
                  ... and {parsedData.length - 10} more rows
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                Processing Results
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {results.totalRows}
                </div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.successfulCreations}
                </div>
                <div className="text-sm text-gray-600">Certificates Created</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {results.totalRows - results.successfulCreations}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>



            {/* Blockchain Deployment Section */}
            {results.successfulCreations > 0 && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-purple-900">Blockchain Deployment</h3>
                      <p className="text-sm text-purple-700">secured via Thirdweb</p>
                    </div>
                  </div>

                  {!account ? (
                    <span className="text-sm text-red-500 font-medium">Connect Wallet to Deploy</span>
                  ) : !orgContract ? (
                    <span className="text-sm text-yellow-600 font-medium">Loading Contract...</span>
                  ) : deploySuccess ? (
                    <span className="flex items-center text-green-600 font-bold">
                      <CheckCircle className="w-5 h-5 mr-1" />
                      Deployed
                    </span>
                  ) : (
                    <button
                      onClick={handleDeployToBlockchain}
                      disabled={isDeploying}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${isDeploying
                        ? "bg-purple-300 text-white cursor-wait"
                        : "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                        }`}
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        "Deploy Batch to Blockchain"
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            <p className="text-green-600 font-medium mb-4">{results.message}</p>

            {results.certificates && results.certificates.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Created Certificates
                </h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Certificate ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Course Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.certificates.map((cert, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{cert.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{cert.certificateId}</td>
                          <td className="border border-gray-300 px-4 py-2">{cert.courseName || "-"}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Created
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {results.excelColumns && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Detected Excel Columns
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.excelColumns.map((column, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {column}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.errors && results.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  Errors ({results.errors.length})
                </h3>
                <div className="max-h-48 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                      <div className="text-red-800 font-medium">Row {error.row}: {error.error}</div>
                      {error.data && (
                        <div className="text-red-600 text-sm mt-1">
                          Data: {JSON.stringify(error.data)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-6 rounded-r-lg">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Excel File Format Instructions
              </h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• <strong>Name</strong> - Student/Recipient name (Required)</li>
                <li>• <strong>Certificate ID</strong> - Unique certificate identifier (Required)</li>
                <li>• <strong>Course Name</strong> - Name of the course/program (Optional)</li>
                <li>• <strong>Course ID</strong> - Course code/NQR code (Optional)</li>
                <li>• <strong>Year</strong> - Year of completion (Optional)</li>
                <li>• <strong>APAAR ID</strong> - Student's APAAR ID (Optional)</li>
              </ul>
              <p className="mt-3 text-yellow-700">
                <strong>Note:</strong> The system will automatically generate certificate images and store them in the database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}