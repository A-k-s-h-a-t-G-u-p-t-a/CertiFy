"use client"

import React, { useRef, useEffect } from "react"
import { Text, Transformer } from "react-konva"

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
        {...shapeProps}
        ref={shapeRef}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          })
        }}

        onTransformEnd={() => {
          const node = shapeRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          node.scaleX(1)
          node.scaleY(1)

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            width: node.width() * scaleX,
            height: node.height() * scaleY,
          })
        }}
      />

      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            return newBox.width < 5 ? oldBox : newBox
          }}
        />
      )}
    </>
  )
}

export default DraggableText
