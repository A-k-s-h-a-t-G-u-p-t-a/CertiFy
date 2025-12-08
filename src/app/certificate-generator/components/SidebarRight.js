"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUp,
  ArrowDown,
  Type,
  ImageIcon,
  Palette,
  SlidersHorizontal,
  Trash2,
  Layers,
  Hash,
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Shield
} from "lucide-react"

const SidebarRight = ({
  elements,
  selectedId,
  updateElement,
  moveLayer,
  deleteSelected,
  showHashOnDownload,
  setShowHashOnDownload,
  uploadedImages, 
  generateCryptoHash,
  generateFileHash,
  hash,
  fileHash,
  hashSettings,     
  setHashSettings,
  addImage,
  account,
  WALLET_CONTRACT_MAPPING,
  processingState,

}) => {
  const selectedElement = elements.find((el) => el.id === selectedId)

  return (
    <aside className="w-64 border-l bg-white/60 backdrop-blur-md shadow-lg p-4 overflow-y-auto">
      <div className="space-y-6">
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
        
        {/* Selected Element Properties */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <SlidersHorizontal className="w-5 h-5 text-purple-600" />
              Properties
            </CardTitle>
          </CardHeader>

          {selectedElement ? (
            <CardContent className="space-y-4">
              {selectedElement.type === "text" && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>Text</Label>
                    <Input
                      value={selectedElement.text}
                      onChange={(e) => updateElement(selectedId, { text: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={selectedElement.fontSize}
                      onChange={(e) =>
                        updateElement(selectedId, { fontSize: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={selectedElement.fill}
                      onChange={(e) => updateElement(selectedId, { fill: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selectedElement.type === "image" && (
                <div className="text-sm text-slate-600 flex gap-2 items-center">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <span>Image Element</span>
                </div>
              )}

              <Button
                onClick={deleteSelected}
                variant="destructive"
                className="w-full flex gap-2 mt-3"
              >
                <Trash2 className="w-4 h-4" />
                Delete Element
              </Button>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-slate-500 text-sm italic">
                No element selected
              </p>
            </CardContent>
          )}
        </Card>

        {/* Layer Management */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Layers className="w-5 h-5 text-amber-600" />
              Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => moveLayer("up")}
              variant="outline"
              className="gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              Bring Forward
            </Button>
            <Button
              onClick={() => moveLayer("down")}
              variant="outline"
              className="gap-2"
            >
              <ArrowDown className="w-4 h-4" />
              Send Backward
            </Button>
          </CardContent>
        </Card>

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
      </div>
    </aside>
  )
}

export default SidebarRight