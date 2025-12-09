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
  <aside className="w-64 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
    <div className="p-4 space-y-4">
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-md">
              <Type className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-semibold">
              Elements
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={addText} 
                  className="h-20 flex-col gap-2 border-slate-300 hover:bg-slate-50 hover:border-blue-400 transition-colors duration-200 rounded-lg group"
                >
                  <div className="p-1.5 bg-blue-600 rounded-md group-hover:bg-blue-700 transition-colors duration-200">
                    <Type className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">Add Text</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new text element</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={triggerFileUpload} 
                  className="h-20 flex-col gap-2 border-slate-300 hover:bg-slate-50 hover:border-blue-400 transition-colors duration-200 rounded-lg group"
                >
                  <div className="p-1.5 bg-blue-600 rounded-md group-hover:bg-blue-700 transition-colors duration-200">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">Add Image</span>
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
                  className="h-11 flex gap-2 text-red-600 hover:text-red-700 border-slate-300 hover:bg-red-50 hover:border-red-400 transition-colors duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="p-1 bg-red-600 rounded group-hover:bg-red-700 transition-colors duration-200">
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium">Delete Selected</span>
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

      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-md">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-semibold">
              Templates
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            onClick={() => loadBackgroundImage("/cert-template.png")}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-lg border-2 border-slate-300 hover:border-blue-400 transition-colors duration-200 bg-white hover:shadow-md">
              <img
                src="/cert-template.png"
                alt="Formal Template"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="bg-white text-blue-600 rounded-full p-2.5 shadow-md">
                  <Type className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 rounded-full px-3 py-1 text-xs">
                Formal Template
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              onClick={() => loadBackgroundImage(null)}
              variant="outline"
              className="w-full border-slate-300 hover:bg-slate-50 transition-colors duration-200 rounded-lg text-slate-700 font-medium"
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