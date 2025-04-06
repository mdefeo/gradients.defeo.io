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
  id: string // Unique ID for each color stop
  color: string
  position: number
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha = 1): string {
  try {
    // Handle different hex formats
    let cleanHex = hex.trim().replace("#", "")

    // Handle shorthand hex (#fff)
    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split("")
        .map((c) => c + c)
        .join("")
    }

    // Ensure we have a valid hex
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      // If not a valid hex, return a default color
      return `rgba(0, 0, 0, ${alpha})`
    }

    // Parse the hex values
    const r = Number.parseInt(cleanHex.substring(0, 2), 16)
    const g = Number.parseInt(cleanHex.substring(2, 4), 16)
    const b = Number.parseInt(cleanHex.substring(4, 6), 16)

    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch (e) {
    // Return a default color if parsing fails
    return `rgba(0, 0, 0, ${alpha})`
  }
}

// Helper function to interpolate between two colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  // Check if the color is already in rgba format
  const rgbaRegex = /rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?$$/

  let r1, g1, b1, a1, r2, g2, b2, a2

  // Parse first color
  const rgba1 = color1.match(rgbaRegex)
  if (rgba1) {
    r1 = Number.parseInt(rgba1[1])
    g1 = Number.parseInt(rgba1[2])
    b1 = Number.parseInt(rgba1[3])
    a1 = rgba1[4] !== undefined ? Number.parseFloat(rgba1[4]) : 1
  } else {
    // Try to convert from hex
    const rgba = hexToRgba(color1).match(rgbaRegex)
    if (!rgba) return color1 // Fallback
    r1 = Number.parseInt(rgba[1])
    g1 = Number.parseInt(rgba[2])
    b1 = Number.parseInt(rgba[3])
    a1 = rgba[4] !== undefined ? Number.parseFloat(rgba[4]) : 1
  }

  // Parse second color
  const rgba2 = color2.match(rgbaRegex)
  if (rgba2) {
    r2 = Number.parseInt(rgba2[1])
    g2 = Number.parseInt(rgba2[2])
    b2 = Number.parseInt(rgba2[3])
    a2 = rgba2[4] !== undefined ? Number.parseFloat(rgba2[4]) : 1
  } else {
    // Try to convert from hex
    const rgba = hexToRgba(color2).match(rgbaRegex)
    if (!rgba) return color2 // Fallback
    r2 = Number.parseInt(rgba[1])
    g2 = Number.parseInt(rgba[2])
    b2 = Number.parseInt(rgba[3])
    a2 = rgba[4] !== undefined ? Number.parseFloat(rgba[4]) : 1
  }

  // Interpolate
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

  // Generate a unique ID for new color stops
  const generateId = () => `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const addColorStop = () => {
    if (colorStops.length < 5) {
      // Find middle position between existing stops
      const positions = colorStops.map((stop) => stop.position)
      const min = Math.min(...positions)
      const max = Math.max(...positions)
      const middle = min + (max - min) / 2

      // Generate a random color
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

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItem(id)
    e.dataTransfer.effectAllowed = "move"
    // Add some transparency to the dragged item
    setTimeout(() => {
      const element = document.getElementById(`color-stop-${id}`)
      if (element) element.style.opacity = "0.5"
    }, 0)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (id !== draggedItem) {
      setDragOverItem(id)
    }
  }

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    const element = document.getElementById(`color-stop-${id}`)
    if (element) element.style.opacity = "1"
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()

    if (draggedItem === null || draggedItem === id) return

    // Find the indices of the dragged and target items
    const draggedIndex = colorStops.findIndex((stop) => stop.id === draggedItem)
    const targetIndex = colorStops.findIndex((stop) => stop.id === id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Create a new array with the items reordered
    const newColorStops = [...colorStops]

    // Get the dragged and target stops
    const draggedStop = { ...newColorStops[draggedIndex] }
    const targetStop = { ...newColorStops[targetIndex] }

    // Swap the position values between the dragged and target stops
    const tempPosition = draggedStop.position
    draggedStop.position = targetStop.position
    targetStop.position = tempPosition

    // Update the stops with swapped positions
    newColorStops[draggedIndex] = draggedStop
    newColorStops[targetIndex] = targetStop

    // Update the state with the new order and swapped positions
    setColorStops(newColorStops)

    // Reset drag state
    setDraggedItem(null)
    setDragOverItem(null)

    // Reset opacity
    const element = document.getElementById(`color-stop-${draggedItem}`)
    if (element) element.style.opacity = "1"
  }

  const generateGradientCSS = () => {
    // Sort color stops by position
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position)

    // Generate intermediate stops based on smoothness
    let allStops = [...sortedStops]

    // Only add intermediate stops if smoothness > 0
    if (smoothness > 0) {
      const intermediateStops = []

      // Calculate how many intermediate stops to add between each pair
      // More smoothness = more intermediate stops (exponential scale for more noticeable effect)
      const stopsToAdd = Math.round(Math.pow(smoothness / 10, 1.5) + 1)

      // For each pair of adjacent stops, add intermediate stops
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const currentStop = sortedStops[i]
        const nextStop = sortedStops[i + 1]

        // Add the current stop (converted to rgba)
        intermediateStops.push({
          ...currentStop,
          color: hexToRgba(currentStop.color),
        })

        // Calculate and add intermediate stops
        for (let j = 1; j <= stopsToAdd; j++) {
          const factor = j / (stopsToAdd + 1)
          const position = currentStop.position + factor * (nextStop.position - currentStop.position)

          // Convert colors to rgba and interpolate
          const color1 = hexToRgba(currentStop.color)
          const color2 = hexToRgba(nextStop.color)
          const color = interpolateColor(color1, color2, factor)

          intermediateStops.push({
            id: `intermediate-${i}-${j}`,
            color,
            position,
          })
        }

        // Add the last stop if it's the final pair (converted to rgba)
        if (i === sortedStops.length - 2) {
          intermediateStops.push({
            ...nextStop,
            color: hexToRgba(nextStop.color),
          })
        }
      }

      allStops = intermediateStops
    } else {
      // If no smoothness, still convert colors to rgba
      allStops = sortedStops.map((stop) => ({
        ...stop,
        color: hexToRgba(stop.color),
      }))
    }

    // Create the color stops string with proper formatting
    const stopsString = allStops.map((stop) => `${stop.color} ${stop.position}%`).join(",\n  ")

    let gradientCSS = ""
    let backgroundSize = "100% 100%"
    let backgroundRepeat = ""

    // Determine if this is a repeating gradient
    const isRepeating = gradientType.startsWith("repeating-")

    // For repeating gradients, adjust the size
    if (isRepeating) {
      // Calculate repeat size based on smoothness (inverse relationship)
      const repeatSize = Math.max(5, 110 - smoothness)
      backgroundSize = `${repeatSize}% ${repeatSize}%`
      backgroundRepeat = "repeat"
    }

    // Build the gradient CSS with proper formatting
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

    // Generate formatted CSS for display
    let cssCodeText = `background-image: ${gradientCSS};`

    if (isRepeating) {
      cssCodeText += `\nbackground-size: ${backgroundSize};`
      cssCodeText += `\nbackground-repeat: ${backgroundRepeat};`
    }

    // For applying the style, we need a non-formatted version
    const inlineGradientCSS = gradientCSS.replace(/\n\s*/g, " ")

    return {
      gradientCSS: inlineGradientCSS,
      backgroundSize,
      backgroundRepeat,
      cssCodeText,
      stopsCount: allStops.length,
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
        // Fallback method using a temporary textarea element
        const textArea = document.createElement("textarea")
        textArea.value = cssCode
        textArea.style.position = "fixed" // Avoid scrolling to bottom
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

  // Update gradient and dispatch event when settings change
  useEffect(() => {
    const { gradientCSS, backgroundSize, backgroundRepeat, cssCodeText } = generateGradientCSS()

    setCssCode(cssCodeText)

    // Create style object for the gradient
    const newStyle = {
      backgroundImage: gradientCSS,
      backgroundSize,
      backgroundRepeat: backgroundRepeat || undefined,
    }

    setGradientStyle(newStyle)

    // Dispatch custom event with the new gradient style
    const event = new CustomEvent("gradientChange", { detail: newStyle })
    window.dispatchEvent(event)

    // Save to localStorage for persistence
    localStorage.setItem("gradientStyle", JSON.stringify(newStyle))
  }, [colorStops, gradientType, angle, smoothness])

  // Trigger initial gradient on mount
  useEffect(() => {
    // Force an initial gradient update
    const { gradientCSS, backgroundSize, backgroundRepeat, cssCodeText } = generateGradientCSS()

    setCssCode(cssCodeText)

    // Create style object for the gradient
    const initialStyle = {
      backgroundImage: gradientCSS,
      backgroundSize,
      backgroundRepeat: backgroundRepeat || undefined,
    }

    // Dispatch the initial gradient event
    const event = new CustomEvent("gradientChange", { detail: initialStyle })
    window.dispatchEvent(event)

    // Save to localStorage
    localStorage.setItem("gradientStyle", JSON.stringify(initialStyle))
  }, []) // Empty dependency array ensures this runs only once on mount

  // Get the appropriate label for the smoothness slider based on gradient type
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

