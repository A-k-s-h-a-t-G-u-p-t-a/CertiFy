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

// Add animation styles
const animationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-glow {
    animation: glow 3s ease-in-out infinite;
  }
  
  .animate-gradient {
    background-size: 300% 300%;
    animation: gradient-shift 8s ease infinite;
  }
  
  .hover-scale {
    transition: transform 0.3s ease;
  }
  
  .hover-scale:hover {
    transform: scale(1.02);
  }
`

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
    <>
      <style jsx>{animationStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-gradient">
        <div className="w-full max-w-none">
          <TooltipProvider>
            <div className="pt-12 flex flex-col min-h-screen">
              <header className="relative backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl rounded-none mb-0 overflow-hidden hover-scale mx-4">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 animate-pulse"></div>
                
                <div className="relative container mx-auto px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative group animate-float">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                        <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                          <Settings className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          CertBuilder
                        </h1>
                        <p className="text-sm text-slate-600 font-medium">Professional Certificate Designer & Blockchain Deployer</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      {!account ? (
                        <Badge variant="outline" className="gap-2 text-amber-700 border-amber-300 bg-amber-50 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover-scale">
                          <AlertCircle className="w-4 h-4" />
                          Wallet not connected
                        </Badge>
                      ) : WALLET_CONTRACT_MAPPING[account.address] ? (
                        <Badge variant="default" className="gap-2 text-emerald-700 border-emerald-300 bg-emerald-50 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover-scale">
                          <Shield className="w-4 h-4" />
                          Valid Organization
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-2 text-red-700 border-red-300 bg-red-50 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover-scale">
                          <AlertCircle className="w-4 h-4" />
                          Invalid Organization
                        </Badge>
                      )}
                      <Button 
                        onClick={downloadCertificate} 
                        variant="outline" 
                        className="gap-2 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 rounded-xl px-6 py-2.5 hover-scale"
                      >
                        <Download className="w-4 h-4" />
                        Download Only
                      </Button>
                      <Button 
                        onClick={downloadAndProcess} 
                        disabled={processingState.isProcessing || (!account || !WALLET_CONTRACT_MAPPING[account?.address])}
                        className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
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

            <div className="flex flex-1 overflow-hidden h-screen">
              <aside className="w-64 border-r border-white/20 bg-white/30 backdrop-blur-lg overflow-y-auto flex-shrink-0">
                <div className="p-3 space-y-3">
                  {/* Blockchain Status Card */}
                  <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-indigo-100/80 border-white/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                    <CardHeader className="pb-3 relative">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                          Blockchain Status
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 relative">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/30">
                          <span className="text-sm font-semibold text-slate-700">Wallet Status:</span>
                          <Badge variant={account ? "default" : "secondary"} className={`rounded-full px-3 py-1 ${account ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {account ? "Connected" : "Not Connected"}
                          </Badge>
                        </div>
                        
                        {account && (
                          <div className="text-xs text-slate-600 bg-white/40 p-3 rounded-xl border border-white/30">
                            <code className="font-mono">{account.address}</code>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/30">
                          <span className="text-sm font-semibold text-slate-700">Organization:</span>
                          <Badge variant={account && WALLET_CONTRACT_MAPPING[account.address] ? "default" : "destructive"} className={`rounded-full px-3 py-1 ${account && WALLET_CONTRACT_MAPPING[account.address] ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {account && WALLET_CONTRACT_MAPPING[account.address] ? "Valid" : "Invalid"}
                          </Badge>
                        </div>
                        
                        {account && WALLET_CONTRACT_MAPPING[account.address] && (
                          <div className="text-xs text-slate-600 bg-white/40 p-3 rounded-xl border border-white/30">
                            Contract: <code className="font-mono">{WALLET_CONTRACT_MAPPING[account.address]}</code>
                          </div>
                        )}
                        
                        {(!account || !WALLET_CONTRACT_MAPPING[account?.address]) && (
                          <div className="text-xs text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-200 shadow-sm">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">Blockchain deployment requires a valid organization wallet</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {(processingState.isProcessing || processingState.extractionResult || processingState.error) && (
                    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-pink-100/80 border-white/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
                      <CardHeader className="pb-3 relative">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${processingState.error ? 'bg-gradient-to-r from-red-500 to-red-600' : processingState.step === "complete" ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
                            {processingState.error ? (
                              <AlertCircle className="w-5 h-5 text-white" />
                            ) : processingState.step === "complete" ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <Loader2 className="w-5 h-5 animate-spin text-white" />
                            )}
                          </div>
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                            Processing Status
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 relative">
                        {processingState.isProcessing && (
                          <div className="text-sm text-slate-700 bg-white/50 p-4 rounded-xl border border-white/30">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                              <span className="font-medium">
                                {processingState.step === "generating" && "Generating certificate..."}
                                {processingState.step === "converting" && "Converting to file..."}
                                {processingState.step === "extracting" && "Extracting fields with AI..."}
                                {processingState.step === "hashing" && "Generating cryptographic hashes..."}
                                {processingState.step === "blockchain" && "Deploying to blockchain..."}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {processingState.error && (
                          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-sm">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="space-y-2">
                                <div className="font-semibold text-red-800">Error Details:</div>
                                <div className="text-red-700 text-sm">{processingState.error}</div>
                                <div className="text-xs text-red-600 bg-red-100/50 p-2 rounded-lg">
                                  <div>API Endpoint: {apiConfig.extractionUrl}</div>
                                  <div>Check console for detailed logs</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {processingState.extractionResult && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm font-medium text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 p-3 rounded-xl border border-emerald-200">
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                              Certificate deployed successfully!
                            </div>
                            
                            {/* Blockchain Information */}
                            {(processingState.certID || processingState.fileHash || processingState.dataHash || processingState.blockchainTxHash) && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 space-y-3 shadow-sm">
                                <div className="font-semibold text-blue-800 flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  Blockchain Deployment
                                </div>
                                {processingState.certID && (
                                  <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                    <span className="font-medium text-blue-700">Certificate ID:</span> 
                                    <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs font-mono">{processingState.certID}</code>
                                  </div>
                                )}
                                {processingState.fileHash && (
                                  <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                    <span className="font-medium text-blue-700">File Hash:</span> 
                                    <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs font-mono break-all">{processingState.fileHash}</code>
                                  </div>
                                )}
                                {processingState.dataHash && (
                                  <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                    <span className="font-medium text-blue-700">Data Hash:</span> 
                                    <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs font-mono break-all">{processingState.dataHash}</code>
                                  </div>
                                )}
                                {processingState.blockchainTxHash && (
                                  <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                                    <span className="font-medium text-blue-700">Transaction:</span> 
                                    <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs font-mono break-all">{processingState.blockchainTxHash}</code>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* OCR Results */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
                              <div className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Extracted Fields:
                              </div>
                              <div className="max-h-32 overflow-y-auto space-y-2">
                                {Object.keys(processingState.extractionResult.fields || {}).length > 0 ? (
                                  Object.entries(processingState.extractionResult.fields).map(([key, value]) => (
                                    <div key={key} className="bg-white/60 p-2 rounded-lg border border-green-100">
                                      <span className="font-medium text-green-700">{key}:</span> 
                                      <span className="ml-2 text-green-800">{value}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-gray-500 text-center py-4">No fields found</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {uploadedImages.length > 0 && (
                    <Card className="relative overflow-hidden bg-gradient-to-br from-teal-50/80 to-cyan-100/80 border-white/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5"></div>
                      <CardHeader className="pb-3 relative">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                            Uploaded Images
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 relative">
                        <div className="grid grid-cols-2 gap-4">
                          {uploadedImages.map((img) => (
                            <div key={img.id} className="group relative">
                              <div 
                                onClick={() => addImage(img.src)}
                                className="cursor-pointer rounded-xl overflow-hidden border-2 border-white/40 hover:border-teal-300 transition-all duration-300 bg-white/30 backdrop-blur-sm hover:shadow-lg transform hover:scale-105"
                              >
                                <img 
                                  src={img.src} 
                                  alt={img.name}
                                  className="w-full aspect-square object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <div className="bg-white/90 backdrop-blur-sm text-teal-700 rounded-full p-3 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-center mt-2 truncate text-slate-700 font-medium" title={img.name}>
                                {img.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50/80 to-amber-100/80 border-white/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5"></div>
                    <CardHeader className="pb-3 relative">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg">
                          <Hash className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-bold">
                          Certificate Hash
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 relative">
                      <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/30">
                        <Label className="text-sm font-semibold text-slate-700">Auto-add hash on download</Label>
                        <Button
                          variant={showHashOnDownload ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowHashOnDownload(!showHashOnDownload)}
                          className={`rounded-full px-4 transition-all duration-300 ${showHashOnDownload ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 shadow-lg hover:shadow-xl' : 'bg-white/70 border-orange-200 text-orange-700 hover:bg-orange-50'}`}
                        >
                          {showHashOnDownload ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      
                      {showHashOnDownload && (
                        <div className="space-y-4 pt-2 border-t border-white/30">
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700">Hash Prefix</Label>
                            <Input
                              value={hashSettings.prefix}
                              onChange={(e) => setHashSettings(prev => ({ ...prev, prefix: e.target.value }))}
                              placeholder="CERT-"
                              className="bg-white/70 border-white/40 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-slate-700">Font Size</Label>
                              <Select
                                value={hashSettings.fontSize.toString()}
                                onValueChange={(value) => setHashSettings(prev => ({ ...prev, fontSize: parseInt(value) }))}
                              >
                                <SelectTrigger className="bg-white/70 border-white/40 focus:border-orange-300 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 backdrop-blur-sm border-white/40">
                                  <SelectItem value="10">10px</SelectItem>
                                  <SelectItem value="12">12px</SelectItem>
                                  <SelectItem value="14">14px</SelectItem>
                                  <SelectItem value="16">16px</SelectItem>
                                  <SelectItem value="18">18px</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-slate-700">Color</Label>
                              <div className="flex gap-2">
                                {["#666666", "#333333", "#999999", "#cccccc"].map((color) => (
                                  <Button
                                    key={color}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setHashSettings(prev => ({ ...prev, color }))}
                                    className="w-8 h-8 p-0 rounded-full border-2 border-white/40 hover:border-orange-300 transition-all duration-300 hover:scale-110"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                            <div className="text-xs text-orange-800">
                              <strong className="font-semibold">Preview:</strong> 
                              <code className="ml-2 bg-orange-100 px-2 py-1 rounded font-mono">
                                {hashSettings.prefix}1A2B3C4D-5E6F7890
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden bg-gradient-to-br from-green-50/80 to-emerald-100/80 border-white/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
                    <CardHeader className="pb-3 relative">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                          <Type className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                          Elements
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 relative">
                      <div className="grid grid-cols-2 gap-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={addText} 
                              className="h-20 flex-col gap-3 bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70 hover:border-green-300 hover:shadow-lg transition-all duration-300 rounded-xl group"
                            >
                              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <Type className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700">Add Text</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add a new text element</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={triggerFileUpload} 
                              className="h-20 flex-col gap-3 bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70 hover:border-green-300 hover:shadow-lg transition-all duration-300 rounded-xl group"
                            >
                              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <ImageIcon className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700">Add Image</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Upload and add an image</TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 mt-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={deleteSelected}
                              disabled={!selectedId}
                              className="h-14 flex gap-3 text-red-600 hover:text-red-700 bg-white/50 backdrop-blur-sm border-white/40 hover:bg-red-50 hover:border-red-300 hover:shadow-lg transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              <div className="p-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <Trash2 className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-semibold">Delete Selected</span>
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

                  <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50/80 to-purple-100/80 border-white/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5"></div>
                    <CardHeader className="pb-3 relative">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-bold">
                          Templates
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 relative">
                      <div
                        onClick={() => loadBackgroundImage("/diploma.png")}
                        className="group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-xl border-2 border-white/40 hover:border-violet-300 transition-all duration-300 bg-white/30 backdrop-blur-sm hover:shadow-lg transform hover:scale-105">
                          <img
                            src="/diploma.png"
                            alt="Classic Diploma"
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-violet-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm text-violet-700 rounded-full p-3 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Type className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <Badge variant="secondary" className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200 rounded-full px-3 py-1">
                            Classic Diploma
                          </Badge>
                        </div>
                      </div>

                      <div
                        onClick={() => loadBackgroundImage("/award.png")}
                        className="group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-xl border-2 border-white/40 hover:border-violet-300 transition-all duration-300 bg-white/30 backdrop-blur-sm hover:shadow-lg transform hover:scale-105">
                          <img
                            src="/award.png"
                            alt="Modern Award"
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-violet-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm text-violet-700 rounded-full p-3 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Type className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <Badge variant="secondary" className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200 rounded-full px-3 py-1">
                            Modern Award
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <Button
                          onClick={() => loadBackgroundImage(null)}
                          variant="outline"
                          className="w-full bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70 hover:border-violet-300 hover:shadow-lg transition-all duration-300 rounded-xl text-slate-700 font-semibold"
                        >
                          Remove Background
                        </Button>
                      </div>
                      
                    </CardContent>
                  </Card>

                </div>
              </aside>

              <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gradient-to-br from-slate-100/50 via-blue-50/30 to-indigo-100/50">
                <div className="flex-1 overflow-hidden p-2 flex items-center justify-center relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.1) 2px, transparent 0)`,
                      backgroundSize: '50px 50px'
                    }}></div>
                  </div>
                  
                  <div className="relative z-10 bg-white/80 backdrop-blur-sm border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-xl overflow-hidden">
                    {/* Subtle glow effect around canvas */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 rounded-2xl blur-lg opacity-60"></div>
                    
                    <div className="p-1 relative">
                      <Stage
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onMouseDown={checkDeselect}
                        onTouchStart={checkDeselect}
                        ref={stageRef}
                        style={{ position: 'relative', display: 'block', background: 'white' }}
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
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/20 bg-white/70 backdrop-blur-lg p-3">
                  <div className="flex flex-wrap gap-4 items-end overflow-x-auto">
                    <div className="space-y-2 min-w-0 flex-shrink-0">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Background Color
                      </Label>
                      <div className="flex gap-3">
                        {["#ffffff", "#f0f9ff", "#f0fdf4", "#fffbeb"].map((color) => (
                          <Button
                            key={color}
                            variant="outline"
                            size="sm"
                            onClick={() => setBackgroundColor(color)}
                            className="w-10 h-10 p-0 rounded-full border-2 border-white/40 hover:border-slate-300 hover:scale-110 transition-all duration-300 shadow-lg"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-10 h-10 p-0 border-2 border-white/40 rounded-full cursor-pointer hover:border-slate-300 hover:scale-110 transition-all duration-300 shadow-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 min-w-0 flex-shrink-0">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Text Color
                      </Label>
                      <div className="flex gap-3">
                        {["#000000", "#2563eb", "#4b5563"].map((color) => (
                          <Button
                            key={color}
                            variant="outline"
                            size="sm"
                            onClick={() => setTextSettings({ ...textSettings, fill: color })}
                            className="w-10 h-10 p-0 rounded-full border-2 border-white/40 hover:border-slate-300 hover:scale-110 transition-all duration-300 shadow-lg"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <Input
                          type="color"
                          value={textSettings.fill}
                          onChange={(e) => setTextSettings({ ...textSettings, fill: e.target.value })}
                          className="w-10 h-10 p-0 border-2 border-white/40 rounded-full cursor-pointer hover:border-slate-300 hover:scale-110 transition-all duration-300 shadow-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 min-w-0 flex-shrink-0">
                      <Label className="text-sm font-semibold text-slate-700">Font Family</Label>
                      <Select
                        value={textSettings.fontFamily}
                        onValueChange={(value) => setTextSettings({ ...textSettings, fontFamily: value })}
                      >
                        <SelectTrigger className="w-36 bg-white/70 border-white/40 focus:border-blue-300 focus:ring-blue-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-sm border-white/40">
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 min-w-0 flex-shrink-0">
                      <Label className="text-sm font-semibold text-slate-700">Font Size</Label>
                      <Select
                        value={textSettings.fontSize.toString()}
                        onValueChange={(value) => setTextSettings({ ...textSettings, fontSize: Number.parseInt(value) })}
                      >
                        <SelectTrigger className="w-28 bg-white/70 border-white/40 focus:border-blue-300 focus:ring-blue-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-sm border-white/40">
                          <SelectItem value="12">12px</SelectItem>
                          <SelectItem value="16">16px</SelectItem>
                          <SelectItem value="18">18px</SelectItem>
                          <SelectItem value="24">24px</SelectItem>
                          <SelectItem value="32">32px</SelectItem>
                          <SelectItem value="48">48px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700">Style</Label>
                      <div className="flex gap-3">
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
                          className={`w-10 h-10 p-0 font-bold rounded-xl transition-all duration-300 ${textSettings.fontStyle.includes("bold") ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg' : 'bg-white/70 border-white/40 text-slate-700 hover:bg-blue-50'}`}
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
                          className={`w-10 h-10 p-0 italic rounded-xl transition-all duration-300 ${textSettings.fontStyle.includes("italic") ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg' : 'bg-white/70 border-white/40 text-slate-700 hover:bg-blue-50'}`}
                        >
                          I
                        </Button>
                      </div>
                    </div>

                    {selectedId && (
                      <Button 
                        onClick={applyTextSettings} 
                        className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-2.5"
                      >
                        <Settings className="w-4 h-4" />
                        Apply to Selected
                      </Button>
                    )}
                  </div>
                </div>
              </main>

              <aside className="w-64 border-l border-white/20 bg-white/30 backdrop-blur-lg overflow-y-auto flex-shrink-0">
                <div className="p-3">
                  <Card className="relative overflow-hidden bg-gradient-to-br from-rose-50/80 to-pink-100/80 border-white/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5"></div>
                    <CardHeader className="pb-3 relative">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg">
                          <Move className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent font-bold">
                          Properties
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      {selectedElement ? (
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Move className="w-4 h-4" />
                              Position
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600 font-medium">X Coordinate</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.x || 0)}
                                  onChange={(e) => updateElement(selectedId, { x: Number.parseInt(e.target.value) || 0 })}
                                  className="bg-white/70 border-white/40 focus:border-rose-300 focus:ring-rose-200 rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600 font-medium">Y Coordinate</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.y || 0)}
                                  onChange={(e) => updateElement(selectedId, { y: Number.parseInt(e.target.value) || 0 })}
                                  className="bg-white/70 border-white/40 focus:border-rose-300 focus:ring-rose-200 rounded-xl"
                                />
                              </div>
                            </div>
                          </div>

                          <Separator className="bg-white/40" />

                          <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Dimensions
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600 font-medium">Width</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.width || 0)}
                                  onChange={(e) => updateElement(selectedId, { width: Number.parseInt(e.target.value) || 0 })}
                                  className="bg-white/70 border-white/40 focus:border-rose-300 focus:ring-rose-200 rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-600 font-medium">Height</Label>
                                <Input
                                  type="number"
                                  value={Math.round(selectedElement.height || 0)}
                                  onChange={(e) => updateElement(selectedId, { height: Number.parseInt(e.target.value) || 0 })}
                                  className="bg-white/70 border-white/40 focus:border-rose-300 focus:ring-rose-200 rounded-xl"
                                />
                              </div>
                            </div>
                          </div>

                          <Separator className="bg-white/40" />

                          {selectedElement.type === "text" && (
                            <>
                              <div className="space-y-4">
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <Type className="w-4 h-4" />
                                  Font Size
                                </Label>
                                <Input
                                  type="number"
                                  value={selectedElement.fontSize || 24}
                                  onChange={(e) =>
                                    updateElement(selectedId, { fontSize: Number.parseInt(e.target.value) || 24 })
                                  }
                                  className="bg-white/70 border-white/40 focus:border-rose-300 focus:ring-rose-200 rounded-xl"
                                />
                              </div>

                              <Separator className="bg-white/40" />
                              
                              <div className="space-y-4">
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <Type className="w-4 h-4" />
                                  Text Content
                                </Label>
                                <Textarea
                                  value={selectedElement.text || ""}
                                  onChange={(e) => updateElement(selectedId, { text: e.target.value })}
                                  rows={4}
                                  placeholder="Enter your text here..."
                                  className="bg-white/70 border-white/40 focus:border-rose-300 focus:ring-rose-200 rounded-xl resize-none"
                                />
                              </div>
                            </>
                          )}

                          {selectedElement.type === "image" && (
                            <>
                              <div className="space-y-4">
                                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4" />
                                  Image Preview
                                </Label>
                                <div className="p-4 bg-white/50 rounded-xl border border-white/30">
                                  <img 
                                    src={selectedElement.src} 
                                    alt="Selected" 
                                    className="w-full h-24 object-cover rounded-lg shadow-sm"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <Separator className="bg-white/40" />

                          <div className="space-y-3">
                            <Button 
                              variant="destructive" 
                              onClick={deleteSelected} 
                              className="w-full gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Element
                            </Button>
                            
                            <Button
                              onClick={() => setSelectedId(null)}
                              variant="outline"
                              className="w-full bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70 hover:border-rose-300 hover:shadow-lg transition-all duration-300 rounded-xl text-slate-700 font-semibold"
                            >
                              Deselect
                            </Button>
                          </div>

                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Move className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-slate-600 text-sm font-medium">Select an element to edit its properties</p>
                          <p className="text-slate-500 text-xs mt-2">Click on any text or image element on the canvas</p>
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
    </>
  )
}