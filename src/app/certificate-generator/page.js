"use client"
import { useState, useRef, useEffect } from "react"
import { Stage, Layer, Text, Rect, Image as KonvaImage, Transformer } from "react-konva"
import useImage from "use-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, Type, Trash2, Palette, Move, Settings } from "lucide-react"

// Background Image Component
const BackgroundImage = ({ src, width, height }) => {
  const [image] = useImage(src)
  return image ? <KonvaImage image={image} width={width} height={height} /> : null
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

  const stageRef = useRef()

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

  // Handle text editing
  const handleTextDblClick = (element) => {
    const newText = prompt("Edit text:", element.text)
    if (newText !== null) {
      updateElement(element.id, { text: newText })
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

  // Download certificate
  const downloadCertificate = () => {
    const uri = stageRef.current.toDataURL()
    const link = document.createElement("a")
    link.download = "certificate.png"
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelectedId(null)
    }
  }

  const selectedElement = elements.find((el) => el.id === selectedId)

  return (
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
              <Button onClick={downloadCertificate} className="gap-2">
                <Download className="w-4 h-4" />
                Download Certificate
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 border-r bg-card overflow-y-auto">
            <div className="p-6 space-y-6">
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
                        <Button
                          variant="outline"
                          onClick={deleteSelected}
                          disabled={!selectedId}
                          className="h-16 flex-col gap-2 text-destructive hover:text-destructive bg-transparent"
                        >
                          <Trash2 className="w-6 h-6" />
                          <span className="text-xs">Delete</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete selected element</TooltipContent>
                    </Tooltip>
                  </div>
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
                  
                  {/* Remove Background Button */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => loadBackgroundImage(null)}  // Clear background
                      className="btn btn-outline btn-error"
                    >
                      Remove Background
                    </button>
                  </div>
                  
                </CardContent>
              </Card>

            </div>
          </aside>

          {/* Main Canvas */}
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
                  >
                    <Layer>
                      {/* Background */}
                      <Rect width={canvasSize.width} height={canvasSize.height} fill={backgroundColor} />

                      {/* Background Image */}
                      {backgroundImage && (
                        <BackgroundImage src={backgroundImage} width={canvasSize.width} height={canvasSize.height} />
                      )}

                      {/* Elements */}
                      {elements.map((element) => {
                        if (element.type === "text") {
                          return (
                            <DraggableText
                              key={element.id}
                              shapeProps={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => {
                                setSelectedId(element.id)
                              }}
                              onChange={(newAttrs) => {
                                updateElement(element.id, newAttrs)
                              }}
                              onDoubleClick={() => handleTextDblClick(element)}
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
                        <Label className="text-sm font-medium">Font Size</Label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize || 24}
                          onChange={(e) =>
                            updateElement(selectedId, { fontSize: Number.parseInt(e.target.value) || 24 })
                          }
                        />
                      </div>

                      {selectedElement.type === "text" && (
                        <>
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

                      <Separator />

                      <Button variant="destructive" onClick={deleteSelected} className="w-full gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Element
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
  )
}
