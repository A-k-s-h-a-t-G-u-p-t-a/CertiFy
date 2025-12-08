"use client"

import { useState, useRef, useEffect} from "react"
import { nanoid } from "nanoid"
import useImage from "use-image"
import { useActiveAccount } from "thirdweb/react"

export const useCertificateLogic = () => {

  // ======== WALLET & BLOCKCHAIN ========
  const account = useActiveAccount()
  
  // Wallet to contract mapping
  const WALLET_CONTRACT_MAPPING = {
    "0x7e14929d682236d3Cb02B6E2aCC779ca9b255E78": "0x1627fb0cc3e87E22648C05Db23c4638B0B881e3E",
    "0x5b2E5aB341743706cFae342A05df91E018838F59": "0xE13FB895ce3Bc12b61Ff725a32b44585DD0ACc2e",
    "0x8e6a18B80bDbdF6422dA06BA04daCe8D832Fea98": "0xD2722d58332c42f27d1242D5Bb8D19e9DBFDB4eD"
  }

  // ======== STATE MANAGEMENT ========

  const [canvasSize] = useState({ width: 800, height: 600 })
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [hash, setHash] = useState("")
  const [fileHash, setFileHash] = useState("")
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
  const [hashSettings, setHashSettings] = useState({
  fontSize: 14,
  color: "#666666",
  prefix: "CERT-",
  })
  const [uploadedImages, setUploadedImages] = useState([])
  const [showHashOnDownload, setShowHashOnDownload] = useState(false)
  const [apiConfig] = useState({
      extractionUrl: "http://localhost:5001/extract",
  })
  const fileInputRef = useRef(null)
  const [textSettings, setTextSettings] = useState({
    fontSize: 20,
    fontFamily: "Arial",
    fill: "#000000",
    fontStyle: "normal",
  })
  const stageRef = useRef(null)
  const [saveState, setSaveState] = useState({
    isSaving: false,
    error: null,
    success: false,
  })

  // ======== CRYPTO FUNCTIONS ========

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

  // ======== EXTRACTION FUNCTIONS ========
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
      x: 450,   // center horizontally
      y: 300,   // center vertically
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#000000",
      fontStyle: "normal",
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

  // ======== HANDLE TEMPLATE SELECTION ========
  const handleTemplateSelect = (templateSrc) => {
    setBackgroundImage({ src: templateSrc, name: templateSrc.split("/").pop() })
  }


    // ======== RIGHT SIDEBAR ========


  // ======== LAYER CONTROL ========
  const bringForward = (id) => {
    setElements((prev) => {
      const index = prev.findIndex((el) => el.id === id)
      if (index === -1 || index === prev.length - 1) return prev
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index + 1]
      updated[index + 1] = temp
      return updated
    })
  }

  const sendBackward = (id) => {
    setElements((prev) => {
      const index = prev.findIndex((el) => el.id === id)
      if (index <= 0) return prev
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index - 1]
      updated[index - 1] = temp
      return updated
    })
  }
  const moveLayer = (direction) => {
    if (!selectedId) return;

    const index = elements.findIndex((el) => el.id === selectedId);
    if (index === -1) return;

    const newElements = [...elements];

    // Remove selected element
    const [selectedEl] = newElements.splice(index, 1);

    let newIndex = index;

    if (direction === "up") {
      newIndex = Math.min(index + 1, elements.length - 1);
    } else if (direction === "down") {
      newIndex = Math.max(index - 1, 0);
    }

    // ALWAYS reinsert the element
    newElements.splice(newIndex, 0, selectedEl);

    setElements(newElements);
  };

  // ======== SAVE CERTIFICATE TO DATABASE ========
  const saveCertificateToDatabase = async () => {
    console.log("Saving certificate to database...")
    
    setSaveState({
      isSaving: true,
      error: null,
      success: false,
    })

    try {
      // Step 1: Convert canvas to file
      console.log("Step 1: Converting canvas to file...")
      const certificateFile = await getCanvasAsFile()

      // Step 2: Extract data with OCR
      console.log("Step 2: Extracting data with OCR...")
      const extractionResult = await extractFieldsFromImage(certificateFile)

      if (!extractionResult.success) {
        throw new Error("OCR extraction failed")
      }

      // Step 3: Generate certificate URL (optional - upload to storage)
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,
        quality: 0.9
      })

      // Step 4: Save to database
      console.log("Step 3: Saving to database...")
      const response = await fetch("/api/certificate/save-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateData: extractionResult,
          certificateUrl: dataURL, // or upload to Cloudinary first
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save certificate")
      }

      console.log("Certificate saved successfully:", data)

      setSaveState({
        isSaving: false,
        error: null,
        success: true,
      })

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveState(prev => ({ ...prev, success: false }))
      }, 3000)

      return data

    } catch (error) {
      console.error("Save certificate error:", error)
      setSaveState({
        isSaving: false,
        error: error.message,
        success: false,
      })
      throw error
    }
  }


  return {
    account,
    WALLET_CONTRACT_MAPPING,
    elements,
    setElements,
    selectedId,
    setSelectedId,
    backgroundImage,
    setBackgroundImage,
    uploadedImages,
    setUploadedImages,
    hash,
    fileHash,
    processingState,
    addText,
    addImage,
    handleFileUpload,
    handleTemplateSelect,
    generateCryptoHash,
    generateFileHash,
    showHashOnDownload,     
    setShowHashOnDownload,   
    triggerFileUpload,
    fileInputRef,
    deleteSelected,
    updateElement,
    bringForward,
    sendBackward,
    hashSettings,
    setHashSettings,
    loadBackgroundImage,
    textSettings,
    setTextSettings,
    moveLayer,
    downloadCertificate,
    downloadAndProcess,
    saveCertificateToDatabase,
    saveState,
    stageRef
  }
}

export default useCertificateLogic
