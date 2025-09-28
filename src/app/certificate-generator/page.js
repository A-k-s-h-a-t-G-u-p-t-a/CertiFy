"use client"

import React, { useState, useRef, useEffect } from "react"
import { Stage, Layer, Text, Rect, Image as KonvaImage, Transformer } from "react-konva"
import useImage from "use-image"
import { useActiveAccount, useSendTransaction } from "thirdweb/react"
import { getContract, prepareContractCall } from "thirdweb"
import { defineChain } from "thirdweb/chains"
import { client } from "../../lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, Type, Trash2, Palette, Move, Settings, Upload, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, Shield, Hash } from "lucide-react"
import ChatbotSidebar from "@/components/ChatbotSidebar"

// Background Image Component
const BackgroundImage = ({ src, width, height }) => {
  const [image] = useImage(src)
  return image ? <KonvaImage image={image} width={width} height={height} /> : null
}

// Draggable Image Component
const DraggableImage = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const [image] = useImage(shapeProps.src)
  const shapeRef = useRef()
  const trRef = useRef()

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([shapeRef.current])
      trRef.current?.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      {image && (
        <KonvaImage
          onClick={onSelect}
          onTap={onSelect}
          ref={shapeRef}
          image={image}
          x={shapeProps.x}
          y={shapeProps.y}
          width={shapeProps.width}
          height={shapeProps.height}
          draggable
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y(),
            })
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current
            const scaleX = node.scaleX()
            const scaleY = node.scaleY()

            node.scaleX(1)
            node.scaleY(1)

            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
            })
          }}
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}

// Draggable Text Component
const DraggableText = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef()
  const trRef = useRef()

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([shapeRef.current])
      trRef.current?.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <Text
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          node.scaleX(1)
          node.scaleY(1)

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}

export default function CertificateBuilder() {
  // Wallet to contract mapping (same as org page)
  const WALLET_CONTRACT_MAPPING = {
    "0x7e14929d682236d3Cb02B6E2aCC779ca9b255E78": "0x1627fb0cc3e87E22648C05Db23c4638B0B881e3E",
    "0x5b2E5aB341743706cFae342A05df91E018838F59": "0xE13FB895ce3Bc12b61Ff725a32b44585DD0ACc2e", 
    "0x8e6a18B80bDbdF6422dA06BA04daCe8D832Fea98": "0xD2722d58332c42f27d1242D5Bb8D19e9DBFDB4eD"
  };

  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  
  const [canvasSize] = useState({ width: 800, height: 600 })
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [textSettings, setTextSettings] = useState({
    fontSize: 24,
    fontFamily: "Arial",
    fill: "#000000",
    fontStyle: "normal",
  })
  const [processingState, setProcessingState] = useState({
    isProcessing: false,
    extractionResult: null,
    error: null,
    step: null,
    blockchainTxHash: null,
    fileHash: null,
    dataHash: null,
    certID: null,
  })
  const [showHashOnDownload, setShowHashOnDownload] = useState(true)
  const [hashSettings, setHashSettings] = useState({
    fontSize: 14,
    color: "#666666",
    prefix: "CERT-"
  })
  const [uploadedImages, setUploadedImages] = useState([])
  const fileInputRef = useRef()
  const stageRef = useRef()

  const [apiConfig] = useState({
    extractionUrl: "http://localhost:5001/extract",
  })

  // Get organization contract for current wallet
  const getOrgContract = () => {
    if (!account?.address) return null;
    
    const contractAddress = WALLET_CONTRACT_MAPPING[account.address];
    if (!contractAddress) return null;

    try {
      return getContract({
        client,
        chain: defineChain(11155111),
        address: contractAddress,
      });
    } catch (error) {
      console.error("Error creating contract:", error);
      return null;
    }
  };

  // Generate crypto hash for data
  const generateCryptoHash = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `0x${hashHex}`;
  };

  // Generate crypto hash for file
  const generateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `0x${hashHex}`;
  };

  // Deploy certificate to blockchain
  const deployToBlockchain = async (certificateFile, extractedData) => {
    try {
      const orgContract = getOrgContract();
      
      if (!orgContract) {
        throw new Error("No valid organization contract found for your wallet");
      }

      if (!account?.address) {
        throw new Error("Please connect your wallet");
      }

      setProcessingState(prev => ({ ...prev, step: "hashing" }));
      
      // Generate certificate ID
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2);
      const certID = `${hashSettings.prefix}${timestamp}-${random}`.toUpperCase();

      // Generate file hash
      const fileHash = await generateFileHash(certificateFile);
      
      // Generate data hash from extracted OCR data
      const dataString = JSON.stringify(extractedData.fields || {});
      const dataHash = await generateCryptoHash(dataString);
      
      // Create encrypted data (simplified - in real implementation you'd encrypt properly)
      const encryptedDataString = btoa(dataString); // Base64 encoding as simple "encryption"
      const encryptedDataBytes = `0x${Array.from(new TextEncoder().encode(encryptedDataString))
        .map(b => b.toString(16).padStart(2, '0')).join('')}`;

      console.log("Blockchain Deployment Data:", {
        certID,
        fileHash,
        dataHash,
        encryptedDataBytes: encryptedDataBytes.substring(0, 100) + "..." // Log only first 100 chars
      });

      setProcessingState(prev => ({ 
        ...prev, 
        step: "blockchain",
        certID,
        fileHash,
        dataHash
      }));

      // Prepare blockchain transaction
      const transaction = prepareContractCall({
        contract: orgContract,
        method: "function issueCertificate(string certID, bytes32 filePhash, bytes32 dataHash, bytes encryptedData)",
        params: [certID, fileHash, dataHash, encryptedDataBytes],
      });

      // Send transaction
      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Certificate deployed to blockchain successfully:", result);
            setProcessingState(prev => ({ 
              ...prev, 
              blockchainTxHash: result.transactionHash 
            }));
            resolve(result);
          },
          onError: (error) => {
            console.error("Failed to deploy certificate:", error);
            reject(error);
          }
        });
      });

      return {
        certID,
        fileHash,
        dataHash,
        encryptedDataBytes
      };

    } catch (error) {
      console.error("Blockchain deployment error:", error);
      throw error;
    }
  };

  // Generate unique hash
  const generateHash = () => {
    const timestamp = Date.now().toString(16)
    const random = Math.random().toString(16).substr(2, 8)
    return `${hashSettings.prefix}${timestamp}-${random}`.toUpperCase()
  }

  // Add hash to canvas temporarily
  const addTemporaryHash = () => {
    if (!showHashOnDownload) return null

    const hash = generateHash()
    const hashElement = {
      id: 'temp-hash-' + Date.now(),
      type: "text",
      text: hash,
      x: 15,
      y: 25,
      fontSize: hashSettings.fontSize,
      fontFamily: "Arial",
      fill: hashSettings.color,
      fontStyle: "normal",
      width: 300,
      isTemporary: true
    }
    
    return hashElement
  }

  // Enhanced extraction function matching your working code exactly
  const extractFieldsFromImage = async (file) => {
    try {
      console.log("Starting extraction for file:", file.name)
      
      const fileBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(fileBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      console.log("Sending request to:", apiConfig.extractionUrl)
      
      const res = await fetch(apiConfig.extractionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          b64: base64Data,
        }),
      });

      console.log("Response status:", res.status)
      
      const data = await res.json();
      console.log("Response data:", data)
      
      if (!res.ok) {
        throw new Error(data.error || "OCR extraction failed");
      }

      const fields = data?.results?.[0]?.fields || {};
      console.log("Extracted fields:", fields)

      return {
        success: true,
        fields: fields,
        rawData: data
      };
    } catch (error) {
      console.error("Extraction error:", error);
      throw error;
    }
  };

  // Process certificate function
  const processCertificate = async (file) => {
    try {
      setProcessingState({ 
        isProcessing: true, 
        step: "extracting",
        extractionResult: null,
        error: null 
      });

      console.log("Processing certificate file:", file.name, file.size, "bytes")

      const extractionResult = await extractFieldsFromImage(file);

      console.log("Extraction completed successfully:", extractionResult)

      setProcessingState({
        isProcessing: false,
        step: "complete",
        extractionResult: extractionResult,
        error: null,
      });

      return extractionResult.fields;
    } catch (err) {
      console.error("Certificate processing failed:", err);
      setProcessingState({
        isProcessing: false,
        step: "error",
        error: err.message,
        extractionResult: null,
      });
      throw err;
    }
  };

  // Add text element
  const addText = () => {
    const newText = {
      id: Date.now(),
      type: "text",
      text: "click to edit",
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2,
      fontSize: textSettings.fontSize,
      fontFamily: textSettings.fontFamily,
      fill: textSettings.fill,
      fontStyle: textSettings.fontStyle,
      width: 200,
    }
    setElements([...elements, newText])
  }

  // Add image element
  const addImage = (imageSrc) => {
    const newImage = {
      id: Date.now(),
      type: "image",
      src: imageSrc,
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 75,
      width: 200,
      height: 150,
    }
    setElements([...elements, newImage])
  }

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageSrc = e.target.result
        setUploadedImages(prev => [...prev, { id: Date.now(), src: imageSrc, name: file.name }])
        addImage(imageSrc)
      }
      reader.readAsDataURL(file)
    }
    event.target.value = ''
  }

  // Trigger file upload
  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  // Update element
  const updateElement = (id, newProps) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...newProps } : el)))
  }

  // Delete selected element
  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter((el) => el.id !== selectedId))
      setSelectedId(null)
    }
  }

  // Apply current text settings to selected element
  const applyTextSettings = () => {
    if (selectedId) {
      updateElement(selectedId, textSettings)
    }
  }

  // Load background image
  const loadBackgroundImage = (templateSrc) => {
    setBackgroundImage(templateSrc)
  }

  // Convert canvas to file for processing with better quality
  const getCanvasAsFile = () => {
    return new Promise((resolve, reject) => {
      try {
        const dataURL = stageRef.current.toDataURL({
          pixelRatio: 2,
          quality: 0.9,
          mimeType: 'image/png'
        });
        
        fetch(dataURL)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `certificate_${Date.now()}.png`, { 
              type: "image/png" 
            });
            console.log("Generated canvas file:", file.name, file.size, "bytes");
            resolve(file);
          })
          .catch(reject);
      } catch (error) {
        console.error("Error converting canvas to file:", error);
        reject(error);
      }
    });
  }

  // Enhanced download function with processing, blockchain deployment and hash
  const downloadAndProcess = async () => {
    console.log("Starting download and process...")
    
    setProcessingState({
      isProcessing: true,
      extractionResult: null,
      error: null,
      step: "generating",
      blockchainTxHash: null,
      fileHash: null,
      dataHash: null,
      certID: null,
    })

    let tempHashElement = null
    if (showHashOnDownload) {
      tempHashElement = addTemporaryHash()
      setElements(prev => [...prev, tempHashElement])
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    try {
      console.log("Step 1: Generating download...")
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,
        quality: 0.9
      })
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `certificate_${timestamp}.png`
      
      const link = document.createElement("a")
      link.download = filename
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setProcessingState(prev => ({ ...prev, step: "converting" }))
      console.log("Step 2: Converting canvas to file...")
      const certificateFile = await getCanvasAsFile()

      console.log("Step 3: Extracting data with OCR...")
      setProcessingState(prev => ({ ...prev, step: "extracting" }))
      const extractionResult = await extractFieldsFromImage(certificateFile);

      console.log("Step 4: Deploying to blockchain...")
      const blockchainData = await deployToBlockchain(certificateFile, extractionResult);

      setProcessingState({
        isProcessing: false,
        extractionResult: extractionResult,
        error: null,
        step: "complete",
        blockchainTxHash: processingState.blockchainTxHash,
        fileHash: blockchainData.fileHash,
        dataHash: blockchainData.dataHash,
        certID: blockchainData.certID,
      });

      console.log("Certificate successfully deployed to blockchain!", blockchainData);

    } catch (error) {
      console.error("Download and process error:", error)
      setProcessingState({
        isProcessing: false,
        extractionResult: null,
        error: error.message,
        step: "error",
        blockchainTxHash: null,
        fileHash: null,
        dataHash: null,
        certID: null,
      })
    } finally {
      if (showHashOnDownload && tempHashElement) {
        setElements(prev => prev.filter(el => el.id !== tempHashElement.id))
      }
    }
  }

  // Regular download without processing but with hash
  const downloadCertificate = async () => {
    let tempHashElement = null
    if (showHashOnDownload) {
      tempHashElement = addTemporaryHash()
      setElements(prev => [...prev, tempHashElement])
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    try {
      const uri = stageRef.current.toDataURL({
        pixelRatio: 2,
        quality: 0.9
      })
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `certificate_${timestamp}.png`
      
      const link = document.createElement("a")
      link.download = filename
      link.href = uri
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      if (showHashOnDownload && tempHashElement) {
        setElements(prev => prev.filter(el => el.id !== tempHashElement.id))
      }
    }
  }

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelectedId(null)
    }
  }

  const selectedElement = elements.find((el) => el.id === selectedId)

  // Add handler for generated images from chatbot
  const handleGeneratedImage = (imageUrl) => {
    // Add the generated image as a draggable element
    const newElement = {
      id: Date.now().toString(),
      type: "image",
      src: imageUrl,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    }
    setElements(prev => [...prev, newElement])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <TooltipProvider>
          <div className="pt-12 flex flex-col min-h-screen bg-background">
            <header className="border-b bg-card shadow-sm">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                      <Settings className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">CertBuilder</h1>
                      <p className="text-sm text-muted-foreground">Professional Certificate Designer</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {!account ? (
                      <Badge variant="outline" className="gap-2 text-yellow-600 border-yellow-300">
                        <AlertCircle className="w-4 h-4" />
                        Wallet not connected
                      </Badge>
                    ) : WALLET_CONTRACT_MAPPING[account.address] ? (
                      <Badge variant="default" className="gap-2 text-green-600 border-green-300 bg-green-50">
                        <Shield className="w-4 h-4" />
                        Valid Organization
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-2 text-red-600 border-red-300">
                        <AlertCircle className="w-4 h-4" />
                        Invalid Organization
                      </Badge>
                    )}
                    <Button onClick={downloadCertificate} variant="outline" className="gap-2 text-black">
                      <Download className="w-4 h-4" />
                      Download Only
                    </Button>
                    <Button 
                      onClick={downloadAndProcess} 
                      disabled={processingState.isProcessing || (!account || !WALLET_CONTRACT_MAPPING[account?.address])}
                      className="gap-2"
                    >
                      {processingState.isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {processingState.step === "generating" && "Generating..."}
                          {processingState.step === "converting" && "Converting..."}
                          {processingState.step === "extracting" && "Extracting..."}
                          {processingState.step === "hashing" && "Hashing..."}
                          {processingState.step === "blockchain" && "Deploying to Blockchain..."}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Download & Deploy to Blockchain
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <aside className="w-80 border-r bg-card overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Blockchain Status Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Blockchain Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Wallet Status:</span>
                          <Badge variant={account ? "default" : "secondary"}>
                            {account ? "Connected" : "Not Connected"}
                          </Badge>
                        </div>
                        
                        {account && (
                          <div className="text-xs text-muted-foreground">
                            <code>{account.address}</code>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Organization:</span>
                          <Badge variant={account && WALLET_CONTRACT_MAPPING[account.address] ? "default" : "destructive"}>
                            {account && WALLET_CONTRACT_MAPPING[account.address] ? "Valid" : "Invalid"}
                          </Badge>
                        </div>
                        
                        {account && WALLET_CONTRACT_MAPPING[account.address] && (
                          <div className="text-xs text-muted-foreground">
                            Contract: <code>{WALLET_CONTRACT_MAPPING[account.address]}</code>
                          </div>
                        )}
                        
                        {(!account || !WALLET_CONTRACT_MAPPING[account?.address]) && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            ⚠️ Blockchain deployment requires a valid organization wallet
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {(processingState.isProcessing || processingState.extractionResult || processingState.error) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {processingState.error ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : processingState.step === "complete" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          )}
                          Processing Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {processingState.isProcessing && (
                          <div className="text-sm text-muted-foreground">
                            {processingState.step === "generating" && "Generating certificate..."}
                            {processingState.step === "converting" && "Converting to file..."}
                            {processingState.step === "extracting" && "Extracting fields with AI..."}
                            {processingState.step === "hashing" && "Generating cryptographic hashes..."}
                            {processingState.step === "blockchain" && "Deploying to blockchain..."}
                          </div>
                        )}
                        
                        {processingState.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <div className="font-semibold mb-1">Error Details:</div>
                            <div>{processingState.error}</div>
                            <div className="mt-2 text-xs">
                              <div>API Endpoint: {apiConfig.extractionUrl}</div>
                              <div>Check console for detailed logs</div>
                            </div>
                          </div>
                        )}

                        {processingState.extractionResult && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-green-600">
                              ✅ Certificate deployed successfully!
                            </div>
                            
                            {/* Blockchain Information */}
                            {(processingState.certID || processingState.fileHash || processingState.dataHash || processingState.blockchainTxHash) && (
                              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                                <div className="font-semibold text-blue-800 flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  Blockchain Deployment
                                </div>
                                {processingState.certID && (
                                  <div className="text-xs">
                                    <span className="font-medium">Certificate ID:</span> 
                                    <code className="ml-1 bg-blue-100 px-1 rounded">{processingState.certID}</code>
                                  </div>
                                )}
                                {processingState.fileHash && (
                                  <div className="text-xs">
                                    <span className="font-medium">File Hash:</span> 
                                    <code className="ml-1 bg-blue-100 px-1 rounded text-xs break-all">{processingState.fileHash}</code>
                                  </div>
                                )}
                                {processingState.dataHash && (
                                  <div className="text-xs">
                                    <span className="font-medium">Data Hash:</span> 
                                    <code className="ml-1 bg-blue-100 px-1 rounded text-xs break-all">{processingState.dataHash}</code>
                                  </div>
                                )}
                                {processingState.blockchainTxHash && (
                                  <div className="text-xs">
                                    <span className="font-medium">Transaction:</span> 
                                    <code className="ml-1 bg-blue-100 px-1 rounded text-xs break-all">{processingState.blockchainTxHash}</code>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* OCR Results */}
                            <div className="text-xs bg-green-50 p-2 rounded max-h-32 overflow-y-auto">
                              <div className="font-semibold mb-1">Extracted Fields:</div>
                              {Object.keys(processingState.extractionResult.fields || {}).length > 0 ? (
                                Object.entries(processingState.extractionResult.fields).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <span className="font-medium">{key}:</span> {value}
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-500">No fields found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {uploadedImages.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          Uploaded Images
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          {uploadedImages.map((img) => (
                            <div key={img.id} className="group relative">
                              <div 
                                onClick={() => addImage(img.src)}
                                className="cursor-pointer rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                              >
                                <img 
                                  src={img.src} 
                                  alt={img.name}
                                  className="w-full aspect-square object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-2">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-center mt-1 truncate" title={img.name}>
                                {img.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Certificate Hash
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Auto-add hash on download</Label>
                        <Button
                          variant={showHashOnDownload ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowHashOnDownload(!showHashOnDownload)}
                        >
                          {showHashOnDownload ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      
                      {showHashOnDownload && (
                        <div className="space-y-3 pt-2 border-t">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Hash Prefix</Label>
                            <Input
                              value={hashSettings.prefix}
                              onChange={(e) => setHashSettings(prev => ({ ...prev, prefix: e.target.value }))}
                              placeholder="CERT-"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Font Size</Label>
                              <Select
                                value={hashSettings.fontSize.toString()}
                                onValueChange={(value) => setHashSettings(prev => ({ ...prev, fontSize: parseInt(value) }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10px</SelectItem>
                                  <SelectItem value="12">12px</SelectItem>
                                  <SelectItem value="14">14px</SelectItem>
                                  <SelectItem value="16">16px</SelectItem>
                                  <SelectItem value="18">18px</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Color</Label>
                              <div className="flex gap-2">
                                {["#666666", "#333333", "#999999", "#cccccc"].map((color) => (
                                  <Button
                                    key={color}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setHashSettings(prev => ({ ...prev, color }))}
                                    className="w-6 h-6 p-0 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            <strong>Preview:</strong> {hashSettings.prefix}1A2B3C4D-5E6F7890
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        Elements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" onClick={addText} className="h-16 flex-col gap-2 bg-transparent">
                              <Type className="w-6 h-6" />
                              <span className="text-xs">Add Text</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add a new text element</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" onClick={triggerFileUpload} className="h-16 flex-col gap-2 bg-transparent">
                              <ImageIcon className="w-6 h-6" />
                              <span className="text-xs">Add Image</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Upload and add an image</TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 mt-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={deleteSelected}
                              disabled={!selectedId}
                              className="h-12 flex gap-2 text-destructive hover:text-destructive bg-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm">Delete Selected</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete selected element</TooltipContent>
                        </Tooltip>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Templates
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div
                        onClick={() => loadBackgroundImage("/diploma.png")}
                        className="group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-colors">
                          <img
                            src="/diploma.png"
                            alt="Classic Diploma"
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-2">
                              <Type className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <Badge variant="secondary">Classic Diploma</Badge>
                        </div>
                      </div>

                      <div
                        onClick={() => loadBackgroundImage("/award.png")}
                        className="group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-colors">
                          <img
                            src="/award.png"
                            alt="Modern Award"
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-2">
                              <Type className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <Badge variant="secondary">Modern Award</Badge>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <Button
                          onClick={() => loadBackgroundImage(null)}
                          variant="outline"
                          className="w-full"
                        >
                          Remove Background
                        </Button>
                      </div>
                      
                    </CardContent>
                  </Card>

                </div>
              </aside>

              <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-muted/30">
                  <Card className="shadow-2xl">
                    <CardContent className="p-0">
                      <Stage
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onMouseDown={checkDeselect}
                        onTouchStart={checkDeselect}
                        ref={stageRef}
                        style={{ position: 'relative' }}
                      >
                        <Layer>
                          {backgroundImage ? (
                            <BackgroundImage
                              src={backgroundImage}
                              width={canvasSize.width}
                              height={canvasSize.height}
                            />
                          ) : (
                            <Rect
                              width={canvasSize.width}
                              height={canvasSize.height}
                              fill={backgroundColor}
                            />
                          )}

                          {elements.map((el) => {
                            if (el.type === "text") {
                              return (
                                <DraggableText
                                  key={el.id}
                                  shapeProps={el}
                                  isSelected={el.id === selectedId}
                                  onSelect={() => setSelectedId(el.id)}
                                  onChange={(newProps) => updateElement(el.id, newProps)}
                                />
                              )
                            } else if (el.type === "image") {
                              return (
                                <DraggableImage
                                  key={el.id}
                                  shapeProps={el}
                                  isSelected={el.id === selectedId}
                                  onSelect={() => setSelectedId(el.id)}
                                  onChange={(newProps) => updateElement(el.id, newProps)}
                                />
                              )
                            }
                            return null
                          })}
                        </Layer>
                      </Stage>
                    </CardContent>
                  </Card>
                </div>

                <div className="border-t bg-card p-6">
                  <div className="flex flex-wrap gap-6 items-end">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Background Color</Label>
                      <div className="flex gap-2">
                        {["#ffffff", "#f0f9ff", "#f0fdf4", "#fffbeb"].map((color) => (
                          <Button
                            key={color}
                            variant="outline"
                            size="sm"
                            onClick={() => setBackgroundColor(color)}
                            className="w-8 h-8 p-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Text Color</Label>
                      <div className="flex gap-2">
                        {["#000000", "#2563eb", "#4b5563"].map((color) => (
                          <Button
                            key={color}
                            variant="outline"
                            size="sm"
                            onClick={() => setTextSettings({ ...textSettings, fill: color })}
                            className="w-8 h-8 p-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <Input
                          type="color"
                          value={textSettings.fill}
                          onChange={(e) => setTextSettings({ ...textSettings, fill: e.target.value })}
                          className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Family</Label>
                      <Select
                        value={textSettings.fontFamily}
                        onValueChange={(value) => setTextSettings({ ...textSettings, fontFamily: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Size</Label>
                      <Select
                        value={textSettings.fontSize.toString()}
                        onValueChange={(value) => setTextSettings({ ...textSettings, fontSize: Number.parseInt(value) })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12px</SelectItem>
                          <SelectItem value="16">16px</SelectItem>
                          <SelectItem value="18">18px</SelectItem>
                          <SelectItem value="24">24px</SelectItem>
                          <SelectItem value="32">32px</SelectItem>
                          <SelectItem value="48">48px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Style</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={textSettings.fontStyle.includes("bold") ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const isBold = textSettings.fontStyle.includes("bold")
                            setTextSettings({
                              ...textSettings,
                              fontStyle: isBold ? textSettings.fontStyle.replace("bold", "").trim() || "normal" : "bold",
                            })
                          }}
                          className="w-8 h-8 p-0 font-bold"
                        >
                          B
                        </Button>
                        <Button
                          variant={textSettings.fontStyle.includes("italic") ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const isItalic = textSettings.fontStyle.includes("italic")
                            setTextSettings({
                              ...textSettings,
                              fontStyle: isItalic
                                ? textSettings.fontStyle.replace("italic", "").trim() || "normal"
                                : "italic",
                            })
                          }}
                          className="w-8 h-8 p-0 italic"
                        >
                          I
                        </Button>
                      </div>
                    </div>

                    {selectedId && (
                      <Button onClick={applyTextSettings} className="gap-2">
                        <Settings className="w-4 h-4" />
                        Apply to Selected
                      </Button>
                    )}
                  </div>
                </div>
              </main>

              <aside className="w-80 border-l bg-card overflow-y-auto">
                <div className="p-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Move className="w-5 h-5" />
                        Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedElement ? (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Position</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">X</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.x || 0)}
                                  onChange={(e) => updateElement(selectedId, { x: Number.parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Y</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.y || 0)}
                                  onChange={(e) => updateElement(selectedId, { y: Number.parseInt(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Dimensions</Label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Width</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.width || 0)}
                                  onChange={(e) => updateElement(selectedId, { width: Number.parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Height</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.height || 0)}
                                  onChange={(e) => updateElement(selectedId, { height: Number.parseInt(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {selectedElement.type === "text" && (
                            <>
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Font Size</Label>
                                <Input
                                  type="number"
                                  value={selectedElement.fontSize || 24}
                                  onChange={(e) =>
                                    updateElement(selectedId, { fontSize: Number.parseInt(e.target.value) || 24 })
                                  }
                                />
                              </div>

                              <Separator />
                              
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Text Content</Label>
                                <Textarea
                                  value={selectedElement.text || ""}
                                  onChange={(e) => updateElement(selectedId, { text: e.target.value })}
                                  rows={3}
                                  placeholder="Enter your text here..."
                                />
                              </div>
                            </>
                          )}

                          {selectedElement.type === "image" && (
                            <>
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Image Source</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                  <img 
                                    src={selectedElement.src} 
                                    alt="Selected" 
                                    className="w-full h-20 object-cover rounded"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <Separator />

                          <Button variant="destructive" onClick={deleteSelected} className="w-full gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete Element
                          </Button>
                          
                          <Button
                            onClick={() => setSelectedId(null)}
                            variant="outline"
                            className="w-full"
                          >
                            Deselect
                          </Button>

                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Move className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">Select an element to edit its properties</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </div>
        </TooltipProvider>

        {/* Add ChatbotSidebar */}
        <ChatbotSidebar onImageGenerated={handleGeneratedImage} />
      </div>
    </div>
  )
}