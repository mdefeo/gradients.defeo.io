"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus, Copy, Check, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ColorPicker } from "./color-picker"

type GradientType = "linear" | "radial" | "conic" | "repeating-linear" | "repeating-radial" | "repeating-conic"

type ColorStop = {
  id: string
  color: string
  position: number
}

function hexToRgba(hex: string, alpha = 1): string {
  try {
    let cleanHex = hex.trim().replace("#", "")

    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split("")
        .map((c) => c + c)
        .join("")
    }

    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      return `rgba(0, 0, 0, ${alpha})`
    }

    const r = Number.parseInt(cleanHex.substring(0, 2), 16)
    const g = Number.parseInt(cleanHex.substring(2, 4), 16)
    const b = Number.parseInt(cleanHex.substring(4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch (e) {
    return `rgba(0, 0, 0, ${alpha})`
  }
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  const rgbaRegex = /rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?$$/

  let r1, g1, b1, a1, r2, g2, b2, a2

  const rgba1 = color1.match(rgbaRegex)
  if (rgba1) {
    r1 = Number.parseInt(rgba1[1])
    g1 = Number.parseInt(rgba1[2])
    b1 = Number.parseInt(rgba1[3])
    a1 = rgba1[4] !== undefined ? Number.parseFloat(rgba1[4]) : 1
  } else {
    const rgba = hexToRgba(color1).match(rgbaRegex)
    if (!rgba) return color1 
    r1 = Number.parseInt(rgba[1])
    g1 = Number.parseInt(rgba[2])
    b1 = Number.parseInt(rgba[3])
    a1 = rgba[4] !== undefined ? Number.parseFloat(rgba[4]) : 1
  }

  const rgba2 = color2.match(rgbaRegex)
  if (rgba2) {
    r2 = Number.parseInt(rgba2[1])
    g2 = Number.parseInt(rgba2[2])
    b2 = Number.parseInt(rgba2[3])
    a2 = rgba2[4] !== undefined ? Number.parseFloat(rgba2[4]) : 1
  } else {
    const rgba = hexToRgba(color2).match(rgbaRegex)
    if (!rgba) return color2 
    r2 = Number.parseInt(rgba[1])
    g2 = Number.parseInt(rgba[2])
    b2 = Number.parseInt(rgba[3])
    a2 = rgba[4] !== undefined ? Number.parseFloat(rgba[4]) : 1
  }

  const r = Math.round(r1 + factor * (r2 - r1))
  const g = Math.round(g1 + factor * (g2 - g1))
  const b = Math.round(b1 + factor * (b2 - b1))
  const a = a1 + factor * (a2 - a1)

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export default function GradientGenerator() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: "stop-1", color: "#ff5f6d", position: 0 },
    { id: "stop-2", color: "#ffc371", position: 100 },
  ])
  const [gradientType, setGradientType] = useState<GradientType>("linear")
  const [angle, setAngle] = useState(90)
  const [smoothness, setSmoothness] = useState(0)
  const [cssCode, setCssCode] = useState("")
  const [gradientStyle, setGradientStyle] = useState({})
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const generateId = () => `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const addColorStop = () => {
    if (colorStops.length < 5) {
      const positions = colorStops.map((stop) => stop.position)
      const min = Math.min(...positions)
      const max = Math.max(...positions)
      const middle = min + (max - min) / 2

      const randomColor = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`

      setColorStops([...colorStops, { id: generateId(), color: randomColor, position: middle }])
    }
  }

  const removeColorStop = (index: number) => {
    if (colorStops.length > 2) {
      const newColorStops = [...colorStops]
      newColorStops.splice(index, 1)
      setColorStops(newColorStops)
    }
  }

  const updateColorStop = (index: number, field: keyof Omit<ColorStop, "id">, value: string | number) => {
    const newColorStops = [...colorStops]
    newColorStops[index] = {
      ...newColorStops[index],
      [field]: value,
    }
    setColorStops(newColorStops)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItem(id)
    e.dataTransfer.effectAllowed = "move"
    setTimeout(() => {
      const element = document.getElementById(`color-stop-${id}`)
      if (element) element.style.opacity = "0.5"
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (id !== draggedItem) {
      setDragOverItem(id)
    }
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    const element = document.getElementById(`color-stop-${id}`)
    if (element) element.style.opacity = "1"
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()

    if (draggedItem === null || draggedItem === id) return

    const draggedIndex = colorStops.findIndex((stop) => stop.id === draggedItem)
    const targetIndex = colorStops.findIndex((stop) => stop.id === id)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newColorStops = [...colorStops]

    const [draggedStop] = newColorStops.splice(draggedIndex, 1)

    newColorStops.splice(targetIndex, 0, draggedStop)

    const updatedStops = newColorStops.map((stop, index) => {
      const newPosition = newColorStops.length <= 1 ? 0 : Math.round((index / (newColorStops.length - 1)) * 100)

      return {
        ...stop,
        position: newPosition,
      }
    })

    setColorStops(updatedStops)

    setDraggedItem(null)
    setDragOverItem(null)

    const element = document.getElementById(`color-stop-${draggedItem}`)
    if (element) element.style.opacity = "1"
  }

  const generateGradientCSS = () => {
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position)

    let allStops = [...sortedStops]

    if (smoothness > 0) {
      const intermediateStops = []

      const stopsToAdd = Math.round(Math.pow(smoothness / 10, 1.5) + 1)

      for (let i = 0; i < sortedStops.length - 1; i++) {
        const currentStop = sortedStops[i]
        const nextStop = sortedStops[i + 1]

        intermediateStops.push({
          ...currentStop,
          color: hexToRgba(currentStop.color),
        })

        for (let j = 1; j <= stopsToAdd; j++) {
          const factor = j / (stopsToAdd + 1)
          const position = currentStop.position + factor * (nextStop.position - currentStop.position)

          const color1 = hexToRgba(currentStop.color)
          const color2 = hexToRgba(nextStop.color)
          const color = interpolateColor(color1, color2, factor)

          intermediateStops.push({
            id: `intermediate-${i}-${j}`,
            color,
            position,
          })
        }

        if (i === sortedStops.length - 2) {
          intermediateStops.push({
            ...nextStop,
            color: hexToRgba(nextStop.color),
          })
        }
      }

      allStops = intermediateStops
    } else {
      allStops = sortedStops.map((stop) => ({
        ...stop,
        color: hexToRgba(stop.color),
      }))
    }

    const isRepeating = gradientType.startsWith("repeating-")

    let gradientSize = 100
    if (isRepeating) {
      gradientSize = Math.max(10, 100 - smoothness)
    }

    let stopsString = ""

    if (isRepeating) {
      if (gradientType === "repeating-conic") {
        const segmentSize = Math.max(5, 30 - smoothness / 4)

        const stops = []
        for (let i = 0; i < allStops.length; i++) {
          const stop = allStops[i]
          const nextStop = allStops[(i + 1) % allStops.length]

          const startDeg = (stop.position / 100) * segmentSize
          const endDeg = startDeg + segmentSize / allStops.length

          stops.push(`${stop.color} ${startDeg}deg ${endDeg}deg`)
        }

        stopsString = stops.join(",\n  ")
      } else if (gradientType === "repeating-linear") {
        const stops = []
        for (let i = 0; i < allStops.length; i++) {
          const stop = allStops[i]
          stops.push(`${stop.color} ${(stop.position * gradientSize) / 100}px`)
        }

        stops.push(`${allStops[0].color} ${gradientSize}px`)
        stopsString = stops.join(",\n  ")
      } else if (gradientType === "repeating-radial") {
        const stops = []
        for (let i = 0; i < allStops.length; i++) {
          const stop = allStops[i]
          stops.push(`${stop.color} ${(stop.position * gradientSize) / 100}px`)
        }

        stops.push(`${allStops[0].color} ${gradientSize}px`)
        stopsString = stops.join(",\n  ")
      }
    } else {
      stopsString = allStops.map((stop) => `${stop.color} ${stop.position}%`).join(",\n  ")
    }

    let gradientCSS = ""

    switch (gradientType) {
      case "linear":
        gradientCSS = `linear-gradient(\n  ${angle}deg,\n  ${stopsString}\n)`
        break
      case "radial":
        gradientCSS = `radial-gradient(\n  circle,\n  ${stopsString}\n)`
        break
      case "conic":
        gradientCSS = `conic-gradient(\n  from ${angle}deg,\n  ${stopsString}\n)`
        break
      case "repeating-linear":
        gradientCSS = `repeating-linear-gradient(\n  ${angle}deg,\n  ${stopsString}\n)`
        break
      case "repeating-radial":
        gradientCSS = `repeating-radial-gradient(\n  circle,\n  ${stopsString}\n)`
        break
      case "repeating-conic":
        gradientCSS = `repeating-conic-gradient(\n  from ${angle}deg,\n  ${stopsString}\n)`
        break
    }

    const cssCodeText = `background-image: ${gradientCSS};`

    const inlineGradientCSS = gradientCSS.replace(/\n\s*/g, " ")

    return {
      gradientCSS: inlineGradientCSS,
      cssCodeText,
    }
  }

  const copyToClipboard = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(cssCode)
        setCopied(true)
        toast({
          title: "Copied!",
          description: "CSS code copied to clipboard",
        })
        setTimeout(() => setCopied(false), 2000)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = cssCode
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          const successful = document.execCommand("copy")
          if (successful) {
            setCopied(true)
            toast({
              title: "Copied!",
              description: "CSS code copied to clipboard",
            })
            setTimeout(() => setCopied(false), 2000)
          } else {
            toast({
              title: "Copy failed",
              description: "Please select and copy the code manually",
              variant: "destructive",
            })
          }
        } catch (err) {
          toast({
            title: "Copy failed",
            description: "Please select and copy the code manually",
            variant: "destructive",
          })
        }

        document.body.removeChild(textArea)
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please select and copy the code manually",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const { gradientCSS, cssCodeText } = generateGradientCSS()

    setCssCode(cssCodeText)

    const newStyle = {
      backgroundImage: gradientCSS,
    }

    setGradientStyle(newStyle)

    const event = new CustomEvent("gradientChange", { detail: newStyle })
    window.dispatchEvent(event)

    localStorage.setItem("gradientStyle", JSON.stringify(newStyle))
  }, [colorStops, gradientType, angle, smoothness])

  useEffect(() => {
    const { gradientCSS, cssCodeText } = generateGradientCSS()

    setCssCode(cssCodeText)

    const initialStyle = {
      backgroundImage: gradientCSS,
    }

    const event = new CustomEvent("gradientChange", { detail: initialStyle })
    window.dispatchEvent(event)

    localStorage.setItem("gradientStyle", JSON.stringify(initialStyle))
  }, []) 

  const getSmoothnessLabel = () => {
    if (gradientType.startsWith("repeating-")) {
      return "Repeat Density"
    }
    return "Smoothness"
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">CSS Gradient Generator</h2>

      <div className="space-y-6">
        {/* Color Stops Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Colors</h3>
            <Button
              onClick={addColorStop}
              disabled={colorStops.length >= 5}
              variant="outline"
              size="icon"
              className="bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 text-blue-500" />
            </Button>
          </div>
          <div className="space-y-4">
            {colorStops.map((stop, index) => (
              <div
                key={stop.id}
                id={`color-stop-${stop.id}`}
                className={`flex items-center gap-4 p-2 rounded-md transition-colors ${dragOverItem === stop.id ? "bg-gray-100" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, stop.id)}
                onDragOver={(e) => handleDragOver(e, stop.id)}
                onDragEnd={(e) => handleDragEnd(e, stop.id)}
                onDrop={(e) => handleDrop(e, stop.id)}
              >
                <div className="cursor-grab">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <ColorPicker color={stop.color} onChange={(color) => updateColorStop(index, "color", color)} />
                <div className="flex-1">
                  <Slider
                    value={[stop.position]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => updateColorStop(index, "position", value[0])}
                  />
                </div>
                <Input
                  type="number"
                  value={stop.position}
                  onChange={(e) => updateColorStop(index, "position", Number.parseInt(e.target.value) || 0)}
                  className="w-16"
                  min={0}
                  max={100}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeColorStop(index)}
                  disabled={colorStops.length <= 2}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient Type Section */}
        <div className="space-y-2">
          <Label htmlFor="gradient-type">Gradient Type</Label>
          <Select value={gradientType} onValueChange={(value) => setGradientType(value as GradientType)}>
            <SelectTrigger id="gradient-type">
              <SelectValue placeholder="Select gradient type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
              <SelectItem value="conic">Conic</SelectItem>
              <SelectItem value="repeating-linear">Repeating Linear</SelectItem>
              <SelectItem value="repeating-radial">Repeating Radial</SelectItem>
              <SelectItem value="repeating-conic">Repeating Conic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Direction Section */}
        {(gradientType === "linear" ||
          gradientType === "conic" ||
          gradientType === "repeating-linear" ||
          gradientType === "repeating-conic") && (
          <div className="space-y-2">
            <Label htmlFor="angle">Direction (degrees)</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="angle"
                value={[angle]}
                min={0}
                max={360}
                step={1}
                onValueChange={(value) => setAngle(value[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={angle}
                onChange={(e) => setAngle(Number.parseInt(e.target.value) || 0)}
                className="w-16"
                min={0}
                max={360}
              />
            </div>
          </div>
        )}

        {/* Smoothness Section */}
        <div className="space-y-2">
          <Label htmlFor="smoothness">{getSmoothnessLabel()}</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="smoothness"
              value={[smoothness]}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => setSmoothness(value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={smoothness}
              onChange={(e) => setSmoothness(Number.parseInt(e.target.value) || 0)}
              className="w-20"
              min={0}
              max={100}
            />
          </div>
        </div>

        {/* CSS Code Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>CSS Code</Label>
            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="bg-muted p-3 rounded-md font-mono text-sm overflow-x-auto whitespace-pre">{cssCode}</div>
        </div>
      </div>
    </div>
  )
}

