"use client"

import React from "react"
import { Image as KonvaImage } from "react-konva"
import useImage from "use-image"

const BackgroundImage = ({ src, stageWidth, stageHeight }) => {
  const [image] = useImage(src)

  if (!image) return null

  // --- Fit image into canvas while keeping aspect ratio ---
  const imgRatio = image.width / image.height
  const canvasRatio = stageWidth / stageHeight

  let renderWidth = stageWidth
  let renderHeight = stageHeight

  if (imgRatio > canvasRatio) {
    // Image is wider → fit width, adjust height
    renderHeight = stageWidth / imgRatio
  } else {
    // Image is taller → fit height, adjust width
    renderWidth = stageHeight * imgRatio
  }

  return (
    <KonvaImage
      image={image}
      width={renderWidth}
      height={renderHeight}
      x={(stageWidth - renderWidth) / 2}
      y={(stageHeight - renderHeight) / 2}
    />
  )
}

export default BackgroundImage
