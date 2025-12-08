"use client"
import React from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import TopHeader from "./components/TopHeader"
import SidebarLeft from "./components/SidebarLeft"
import SidebarRight from "./components/SidebarRight"
import CanvasArea from "./components/CanvasArea"
import ChatbotSidebar from "./components/ChatbotSidebar"
import { useCertificateLogic } from "./hooks/useCertificateLogic"

export default function CertificateBuilder() {
  const logic = useCertificateLogic()

  const handleGeneratedImage = (imageUrl) => {
    const newElement = {
      id: Date.now().toString(),
      type: "image",
      src: imageUrl,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    }
    logic.setElements(prev => [...prev, newElement])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-gradient">
      <TooltipProvider>
        <div className="pt-12 flex flex-col min-h-screen">
          <TopHeader
            account={logic.account}
            WALLET_CONTRACT_MAPPING={logic.WALLET_CONTRACT_MAPPING}
            processingState={logic.processingState}
            downloadCertificate={logic.downloadCertificate}
            downloadAndProcess={logic.downloadAndProcess}
            saveCertificateToDatabase={logic.saveCertificateToDatabase}
            saveState={logic.saveState}
          />
          <div className="flex flex-1 overflow-hidden">
            <SidebarLeft {...logic} />
            <CanvasArea
              elements={logic.elements}
              setElements={logic.setElements}
              selectedId={logic.selectedId}
              setSelectedId={logic.setSelectedId}
              backgroundImage={logic.backgroundImage}
              stageRef={logic.stageRef}
            />
            <SidebarRight {...logic} />
          </div>
        </div>
      </TooltipProvider>

      <ChatbotSidebar onImageGenerated={handleGeneratedImage} />
    </div>
  )
}
