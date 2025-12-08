"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge, Download, Type, Trash2, Palette, Move, Settings, Upload, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, Shield, Hash } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"


const SidebarLeft = ({
  account,
  WALLET_CONTRACT_MAPPING,
  addText,
  addImage,
  handleFileUpload,
  backgroundImage,
  hash,
  fileHash,
  handleTemplateSelect,
  processingState,
  triggerFileUpload, 
  deleteSelected,
  selectedId,
  loadBackgroundImage,
  fileInputRef,        //
 
}) => {
  return (
  <aside className="w-64 border-r border-white/20 bg-white/30 backdrop-blur-lg overflow-y-auto flex-shrink-0">
    <div className="p-3 space-y-3">
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
            id="file-upload" 
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
            onClick={() => loadBackgroundImage("/cert-template.png")}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-xl border-2 border-white/40 hover:border-violet-300 transition-all duration-300 bg-white/30 backdrop-blur-sm hover:shadow-lg transform hover:scale-105">
              <img
                src="/cert-template.png"
                alt="Formal Template"
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
                Formal Template
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
  )
}

export default SidebarLeft