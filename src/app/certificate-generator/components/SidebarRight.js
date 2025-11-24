"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ArrowUp,
  ArrowDown,
  Type,
  ImageIcon,
  Palette,
  SlidersHorizontal,
  Trash2,
  Layers,
} from "lucide-react"

const SidebarRight = ({
  elements,
  selectedId,
  updateElement,
  moveLayer,
  deleteSelected,
}) => {
  const selectedElement = elements.find((el) => el.id === selectedId)

  return (
    <aside className="w-64 border-l bg-white/60 backdrop-blur-md shadow-lg p-4 overflow-y-auto">
      <div className="space-y-6">
        
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
      </div>
    </aside>
  )
}

export default SidebarRight