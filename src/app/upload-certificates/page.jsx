"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ImageIcon,
  Sparkles,
  ArrowRight,
  FileUp,
  Check,
} from "lucide-react"
import * as XLSX from "xlsx"
import { getContract, prepareContractCall, readContract } from "thirdweb"
import { defineChain } from "thirdweb/chains"
import { client } from "@/lib/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useActiveAccount, useSendTransaction, useReadContract } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { computeFileHash, getZeroDataHash } from "@/utils/phash";

// Step indicator component
const StepIndicator = ({ currentStep, steps }) => (
  <div className="flex items-center justify-center mb-8 px-4 overflow-x-auto">
    {steps.map((step, index) => (
      <div key={step.id} className="flex items-center flex-shrink-0">
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
              index < currentStep
                ? "bg-green-200 text-white shadow-lg shadow-green-200"
                : index === currentStep
                  ? "bg-green-600 text-white shadow-lg shadow-green-200 ring-4 ring-green-100"
                  : "bg-green-100 text-black-400"
            }`}
          >
            {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
          </div>
          <span
            className={`text-xs mt-2 font-medium whitespace-nowrap ${
              index <= currentStep ? "text-black-700" : "text-black-300"
            }`}
          >
            {step.label}
          </span>
        </div>
        {index < steps.length - 1 && (
          <div
            className={`w-12 md:w-20 h-1 mx-2 rounded transition-all duration-500 ${
              index < currentStep ? "bg-green-500" : "bg-green-100"
            }`}
          />
        )}
      </div>
    ))}
  </div>
)

export default function UploadCertificatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState("")
  const [parsedData, setParsedData] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  // New UX states
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Blockchain State
  const account = useActiveAccount()
  const { mutate: sendTransaction } = useSendTransaction()
  const [orgContract, setOrgContract] = useState(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)

  const steps = [
    { id: 1, label: "Upload File" },
    { id: 2, label: "Review Data" },
    { id: 3, label: "Generate" },
    { id: 4, label: "Deploy" },
  ]

  // Update step based on state
  useEffect(() => {
    if (deploySuccess) {
      setCurrentStep(4)
    } else if (results) {
      setCurrentStep(3)
    } else if (parsedData) {
      setCurrentStep(2)
    } else if (file) {
      setCurrentStep(1)
    } else {
      setCurrentStep(0)
    }
  }, [file, parsedData, results, deploySuccess])

  // Fetch Organization Contract (Reuse logic from Org.jsx)
  useEffect(() => {
    const fetchOrganization = async () => {
      if (account?.address) {
        try {
          const response = await fetch(`/api/organizations?wallet=${account.address}`)
          const data = await response.json()
          if (data.success && data.organization && data.organization.contractAddress) {
            setOrgContract(
              getContract({
                client,
                chain: defineChain(11155111),
                address: data.organization.contractAddress,
              }),
            )
          }
        } catch (error) {
          console.error("Error fetching organization:", error)
        }
      }
    }
    fetchOrganization()
  }, [account?.address])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    processFile(selectedFile)
  }

  const processFile = (selectedFile) => {
    if (selectedFile) {
      if (
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel"
      ) {
        setFile(selectedFile)
        setError("")
        setParsedData(null)
        setResults(null)
        setDeploySuccess(false)
      } else {
        setError("Please select a valid Excel file (.xlsx or .xls)")
        setFile(null)
        setParsedData(null)
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    setParsedData(null)
    setResults(null)
    setDeploySuccess(false)
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    processFile(droppedFile)
  }, [])

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0]
    if (selectedImage) {
      if (selectedImage.type.startsWith("image/")) {
        setImageFile(selectedImage)
        const reader = new FileReader()
        reader.onload = (event) => {
          setUploadedImage(event.target.result)
        }
        reader.readAsDataURL(selectedImage)
        setError("")
      } else {
        setError("Please select a valid image file (jpg, png, gif, etc.)")
        setImageFile(null)
        setUploadedImage(null)
      }
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setUploadedImage(null)
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result.split(",")[1] // Remove the data:application/... prefix
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError("")
    setResults(null)
    setUploadProgress(0)

    try {
      // Simulate progress for parsing
      setUploadProgress(10)
      console.log("Parsing Excel file...")
      const excelData = await parseExcelFile(file)

      if (!excelData || excelData.length === 0) {
        throw new Error("Excel file is empty or could not be parsed")
      }

      setUploadProgress(30)
      console.log("Parsed Excel data:", excelData)
      setParsedData(excelData)

      // Convert image to base64 if present
      let imageBase64 = null
      if (imageFile) {
        imageBase64 = await convertToBase64(imageFile)
      }

      setUploadProgress(50)

      // Send parsed data directly to uploadxl-simple endpoint
      const response = await fetch("/api/uploadxl-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificates: excelData,
          additionalImage: imageBase64,
        }),
      })

      setUploadProgress(80)

      const data = await response.json()

      if (response.ok && data.success) {
        setResults(data)
        setUploadProgress(100)
      } else {
        setError(data.error || "Upload failed")
        setUploadProgress(0)
      }
    } catch (err) {
      setError("An error occurtext-black during upload: " + err.message)
      console.error("Upload error:", err)
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleDeployToBlockchain = async () => {
    console.log("=== Deploy to Blockchain Started ===");
    console.log("orgContract:", orgContract);
    console.log("results:", results);
    
    if (!orgContract || !results?.certificates) {
      console.error("Missing required data:", { orgContract: !!orgContract, certificates: !!results?.certificates });
      alert("Please ensure wallet is connected and certificates are generated");
      return;
    }

    setIsDeploying(true)
    setDeploySuccess(false)

    try {
      console.log("Handle Deploy - Results:", results)
      if (!results?.certificates) {
        console.error("No certificates in results")
        return
      }

      // Validate certificates have blockchainData with fileHash
      const validCerts = results.certificates.filter((c) => {
        const isValid = c.blockchainData && c.blockchainData.filePhash && c.blockchainData.dataHash && c.blockchainData.encryptedData
        if (!isValid) {
          console.warn("Invalid cert (missing blockchainData):", c)
          console.log("Certificate structure:", JSON.stringify(c, null, 2));
        }
        return isValid
      })

      console.log("Valid Certificates Count:", validCerts.length)
      console.log("Sample valid cert:", validCerts[0]);

      if (validCerts.length === 0) {
        throw new Error("No valid certificates found to deploy. Please re-upload the file to generate hashes.")
      }

      // Extract blockchain data using the new structure
      const certIDList = validCerts.map((c) => c.blockchainData.certID)
      const filePhashList = validCerts.map((c) => c.blockchainData.filePhash)
      const dataHashList = validCerts.map((c) => c.blockchainData.dataHash)
      const encryptedDataList = validCerts.map((c) => c.blockchainData.encryptedData)

      console.log("=== Deploying batch ===");
      console.log("certIDList:", certIDList);
      console.log("filePhashList:", filePhashList);
      console.log("dataHashList:", dataHashList);
      console.log("encryptedDataList:", encryptedDataList);

      const transaction = prepareContractCall({
        contract: orgContract,
        method:
          "function issueCertificatesBatch(string[] certIDList, bytes32[] filePhashList, bytes32[] dataHashList, bytes[] encryptedDataList)",
        params: [certIDList, filePhashList, dataHashList, encryptedDataList],
      })

      console.log("Transaction prepared:", transaction);
      console.log("Sending transaction to wallet...");

      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("✅ Batch deployment successful:", result)
            setDeploySuccess(true)
            alert("Certificates successfully deployed to blockchain!")
            resolve(result)
          },
          onError: (error) => {
            console.error("❌ Batch deployment failed:", error)
            alert(`Blockchain deployment failed: ${error.message}`)
            reject(error)
          },
        })
      })
    } catch (err) {
      console.error("Deployment error:", err)
      alert("Blockchain deployment failed: " + err.message)
    } finally {
      setIsDeploying(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-green-50/30 to-white px-4">
        <Card className="max-w-md w-full animate-in fade-in-50 zoom-in-95 duration-300 shadow-lg border-green-100/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-black-600" />
            </div>
            <CardTitle className="text-2xl text-black-900">Access Denied</CardTitle>
            <CardDescription className="text-black-700/70">Please log in to access this page.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/20 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in-50 slide-in-from-top-5 duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100/60 text-black-700 rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-green-200/50">
            <Sparkles className="w-4 h-4" />
            Bulk Certificate Upload
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-black-900 mb-3">Upload Certificates from Excel</h1>
          <p className="text-black-700/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Upload your Excel file containing certificate data and we'll generate secure, blockchain-verified
            certificates automatically.
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 animate-in fade-in-50 slide-in-from-top-2 duration-300 px-4">
            <div className="bg-text-black-50/80 border border-text-black-200/50 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
              <div className="w-8 h-8 bg-text-black-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-green-200-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-black-800">Upload Error</p>
                <p className="text-sm text-text-black-700/80">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-text-black-400 hover:text-text-black-600 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Upload Section */}
        <Card className="mb-6 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5 duration-500 shadow-lg border-green-100/30 px-4 md:px-0">
          <CardHeader className="border-b bg-gradient-to-r from-green-50/80 to-green-50/40 border-green-100/30 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-black-600" />
              </div>
              <div>
                <CardTitle className="text-black-900">Step 1: Select Your Excel File</CardTitle>
                <CardDescription className="text-black-700/70">
                  Drag & drop or click to upload your certificate data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                isDragging
                  ? "border-green-400 bg-green-50/80 scale-[1.01]"
                  : file
                    ? "border-green-300/50 bg-green-50/40"
                    : "border-green-200/50 hover:border-green-300/70 bg-gradient-to-br from-white to-green-50/30"
              }`}
            >
              {!file ? (
                <>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="excel-upload"
                  />
                  <div className={`transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
                    <div className="w-16 h-16 bg-green-100/60 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileUp
                        className={`w-8 h-8 transition-colors duration-300 ${isDragging ? "text-black-600" : "text-black-400"}`}
                      />
                    </div>
                    <p className="text-lg font-semibold text-black-900 mb-1">
                      {isDragging ? "Drop your file here!" : "Drag & drop your Excel file here"}
                    </p>
                    <p className="text-sm text-black-700/70 mb-4">or click to browse</p>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Badge variant="outline" className="border-green-200/70 text-black-700 bg-green-50/50">
                        XLSX
                      </Badge>
                      <Badge variant="outline" className="border-green-200/70 text-black-700 bg-green-50/50">
                        XLS
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 bg-green-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-7 h-7 text-black-600" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-black-900 truncate">{file.name}</p>
                    <p className="text-sm text-black-700/70">{(file.size / 1024).toFixed(1)} KB • Ready to upload</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="text-black-400 hover:text-black-600 hover:bg-green-50/70 flex-shrink-0 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Optional Image Upload */}
            <div className="mt-6 p-5 bg-gradient-to-br from-green-50/50 to-green-50/20 rounded-xl border border-green-100/50 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-black-600" />
                  <span className="font-semibold text-black-900">Optional: Add Logo or Signature</span>
                  <Badge variant="outline" className="text-xs border-green-200/70 text-black-700 bg-green-50/50">
                    Optional
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {!uploadedImage ? (
                  <label
                    htmlFor="image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200/50 rounded-lg text-black-700 hover:bg-green-50/50 hover:border-green-300/70 transition-all duration-200 cursor-pointer font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-green-200/50">
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black-900 truncate">{imageFile?.name}</p>
                      <p className="text-xs text-black-700/70">{(imageFile?.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeImage}
                      className="text-black-400 hover:text-black-600 hover:bg-green-50/70 flex-shrink-0 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <div className="mt-8 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload and Process
                  </>
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-6 space-y-2">
                <Progress value={uploadProgress} className="h-2 rounded-full bg-green-100/50" />
                <p className="text-xs text-black-700/70 text-center">{uploadProgress}% Complete</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parsed Data Preview */}
        {parsedData && (
          <Card className="mb-6 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5 duration-500 shadow-lg border-green-100/30">
            <CardHeader className="border-b bg-gradient-to-r from-green-50/80 to-green-50/40 border-green-100/30 py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-black-900">Excel Data Preview</CardTitle>
                  <CardDescription className="text-black-700/70">
                    {parsedData.length} rows found in your file
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="max-h-96 overflow-auto rounded-lg border border-green-100/50">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-green-50/80 sticky top-0">
                    <tr>
                      {parsedData.length > 0 && Object.keys(parsedData[0]).map((key) => (
                        <th key={key} className="border-b border-green-200/50 px-3 py-2 text-left text-xs font-semibold text-black-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-green-50/40 transition-colors">
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="border-b border-green-100/30 px-3 py-2 text-xs text-black-700">
                            {String(value || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 10 && (
                <p className="text-black-600/70 text-sm mt-3 text-center">
                  ... and {parsedData.length - 10} more rows
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {results && (
          <Card className="mb-6 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5 duration-500 shadow-lg border-green-100/30 px-4 md:px-0">
            <CardHeader className="border-b bg-gradient-to-r from-green-50/80 to-green-50/40 border-green-100/30 py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100/80 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-black-900">Processing Complete</CardTitle>
                  <CardDescription className="text-black-700/70">
                    {results.certificates?.length} certificates generated successfully
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <Button
                onClick={handleDeployToBlockchain}
                disabled={isDeploying || !orgContract}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Deploying to Blockchain...
                  </>
                ) : deploySuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Successfully Deployed!
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Deploy to Blockchain
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}