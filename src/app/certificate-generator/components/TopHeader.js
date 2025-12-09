"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Download, Settings, Shield, AlertCircle, Save, CheckCircle } from "lucide-react"

const TopHeader = ({ account, WALLET_CONTRACT_MAPPING, processingState, downloadCertificate, downloadAndProcess, saveCertificateToDatabase, saveState }) => {
  return (
            <header className="relative backdrop-blur-lg bg-white/70 border border-white/20 shadow-xl rounded-none mb-0 overflow-hidden hover-scale mx-4">
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
                      <Button 
                        onClick={saveCertificateToDatabase}
                        disabled={saveState?.isSaving}
                        variant="outline" 
                        className="gap-2 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 rounded-xl px-6 py-2.5 hover-scale"
                      >
                        {saveState?.isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : saveState?.success ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
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
                        variant="outline" 
                        className="gap-2 bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 rounded-xl px-6 py-2.5 hover-scale"
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