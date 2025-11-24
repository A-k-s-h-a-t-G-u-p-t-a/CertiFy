"use client"

import React from "react"
import { Stage, Layer } from "react-konva"
import DraggableText from "./DraggableText"
import DraggableImage from "./DraggableImage"
import BackgroundImage from "./BackgroundImage"

const CanvasArea = ({
  elements,
  setElements,
  selectedId,
  setSelectedId,
  backgroundImage,
  stageRef,
}) => {
  const handleSelect = (id) => setSelectedId(id)

  const handleChange = (id, newAttrs) => {
    const updated = elements.map((el) =>
      el.id === id ? { ...el, ...newAttrs } : el
    )
    setElements(updated)
  }

  return (
    <div className="flex-1 relative flex justify-center items-center bg-gray-50 p-6">
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white shadow-inner overflow-hidden">

        <Stage
          ref={stageRef}
          width={900}
          height={600}
          className="rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            const clickedOnEmpty = e.target === e.target.getStage()
            if (clickedOnEmpty) setSelectedId(null)
          }}
        >
  
          {/* Layer 1: Background */}
          <Layer listening={false}>
            {backgroundImage && (
              <BackgroundImage 
                src={backgroundImage}
                stageWidth={900}
                stageHeight={600}
              />
            )}
          </Layer>

          {/* Layer 2: User Elements */}
          <Layer>
            {elements.map((el) => {
              if (el.type === "text") {
                return (
                  <DraggableText
                    key={el.id}
                    shapeProps={el}
                    isSelected={el.id === selectedId}
                    onSelect={() => handleSelect(el.id)}
                    onChange={(newAttrs) => handleChange(el.id, newAttrs)}
                  />
                )
              }

              if (el.type === "image") {
                return (
                  <DraggableImage
                    key={el.id}
                    shapeProps={el}
                    isSelected={el.id === selectedId}
                    onSelect={() => handleSelect(el.id)}
                    onChange={(newAttrs) => handleChange(el.id, newAttrs)}
                  />
                )
              }

              return null
            })}
          </Layer>

        </Stage>


      </div>
    </div>
  )
}

export default CanvasArea
