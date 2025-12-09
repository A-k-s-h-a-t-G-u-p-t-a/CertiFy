"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Download, Settings, Shield, AlertCircle, Save, CheckCircle } from "lucide-react"

const TopHeader = ({ account, WALLET_CONTRACT_MAPPING, processingState, downloadCertificate, downloadAndProcess, saveCertificateToDatabase, saveState }) => {
  return (
            <header className="relative bg-white border-b border-slate-200 shadow-sm mb-0 overflow-hidden mx-4">
                <div className="relative container mx-auto px-8 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="relative flex items-center justify-center w-11 h-11 bg-blue-600 rounded-lg shadow-sm transform group-hover:scale-105 transition-transform duration-200">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <h1 className="text-2xl font-bold text-slate-900">
                          CertBuilder
                        </h1>
                        <p className="text-sm text-slate-600">Professional Certificate Designer</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Button 
                        onClick={saveCertificateToDatabase}
                        disabled={saveState?.isSaving}
                        variant="outline" 
                        className="gap-2 border-slate-300 hover:bg-slate-50 transition-colors duration-200 rounded-lg px-5 py-2"
                      >
                        {saveState?.isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : saveState?.success ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save to DB
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={downloadCertificate} 
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 rounded-lg px-5 py-2 shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>          
                    </div>
                  </div>
                </div>
            </header>
  )
}

export default TopHeader