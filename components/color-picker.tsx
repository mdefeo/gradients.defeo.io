"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GripHorizontal } from "lucide-react"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [hsv, setHsv] = useState({ h: 0, s: 0, v: 0 })
  const [inputValue, setInputValue] = useState("")
  const [format, setFormat] = useState<"HEX" | "RGBa">("HEX")
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const colorFieldRef = useRef<HTMLDivElement>(null)
  const hueSliderRef = useRef<HTMLDivElement>(null)
  const isDraggingField = useRef(false)
  const isDraggingHue = useRef(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hsv = hexToHsv(color)
    setHsv(hsv)
    setInputValue(color)
  }, [color, isOpen])

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingField.current && colorFieldRef.current) {
        const rect = colorFieldRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

        setHsv((prev) => {
          const newHsv = { ...prev, s: x, v: 1 - y }
          const newColor = hsvToHex(newHsv)
          onChange(newColor)
          setInputValue(newColor)
          return newHsv
        })
      }

      if (isDraggingHue.current && hueSliderRef.current) {
        const rect = hueSliderRef.current.getBoundingClientRect()
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

        setHsv((prev) => {
          const newHsv = { ...prev, h: 360 - Math.round(y * 360) }
          const newColor = hsvToHex(newHsv)
          onChange(newColor)
          setInputValue(newColor)
          return newHsv
        })
      }

      if (isDragging) {
        setPosition({
          x: position.x + e.clientX - dragStart.x,
          y: position.y + e.clientY - dragStart.y,
        })
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      isDraggingField.current = false
      isDraggingHue.current = false
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [onChange, isDragging, dragStart, position])

  const generateRandomColor = () => {
    const randomHex =
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
    onChange(randomHex)
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)

    try {
      const tempEl = document.createElement("div")
      tempEl.style.color = value
      if (tempEl.style.color !== "") {
        onChange(value)
      }
    } catch (error) {
      console.error("Error parsing color:", error)
    }
  }

  const startDragging = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }

  function hsvToRgb(h: number, s: number, v: number) {
    let r = 0,
      g = 0,
      b = 0

    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    switch (i % 6) {
      case 0:
        r = v
        g = t
        b = p
        break
      case 1:
        r = q
        g = v
        b = p
        break
      case 2:
        r = p
        g = v
        b = t
        break
      case 3:
        r = p
        g = q
        b = v
        break
      case 4:
        r = t
        g = p
        b = v
        break
      case 5:
        r = v
        g = p
        b = q
        break
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    }
  }

  function hsvToHex(hsv: { h: number; s: number; v: number }) {
    const h = hsv.h / 360
    const { r, g, b } = hsvToRgb(h, hsv.s, hsv.v)
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  }

  function hexToHsv(hex: string): { h: number; s: number; v: number } {
    let r = 0,
      g = 0,
      b = 0

    try {
      const tempEl = document.createElement("div")
      tempEl.style.color = hex

      const computedColor = getComputedStyle(tempEl).color
      const rgbMatch = computedColor.match(/\d+/g)

      if (rgbMatch && rgbMatch.length >= 3) {
        r = Number.parseInt(rgbMatch[0]) / 255
        g = Number.parseInt(rgbMatch[1]) / 255
        b = Number.parseInt(rgbMatch[2]) / 255
      }
    } catch (error) {
      console.error("Error parsing hex color:", error)
    }

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    // Calculate HSV values
    let h = 0
    const s = max === 0 ? 0 : delta / max
    const v = max

    if (delta === 0) {
      h = 0
    } else if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }

    h = Math.round(h * 60)
    if (h < 0) h += 360

    return { h, s, v }
  }

  function hsvToRgbaString(hsv: { h: number; s: number; v: number }) {
    const h = hsv.h / 360
    const { r, g, b } = hsvToRgb(h, hsv.s, hsv.v)
    return `rgba(${r}, ${g}, ${b}, 1)`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn("w-10 h-10 rounded-md border border-gray-300 cursor-pointer", className)}
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <div
        ref={modalRef}
        className="fixed z-50"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: isOpen ? "auto" : "none",
          display: isOpen ? "block" : "none",
        }}
      >
        <div className="absolute top-[calc(50%-200px)] left-[calc(50%-200px)] w-[400px] bg-white rounded-md shadow-lg border border-gray-200">
          <div
            className="px-4 py-2 border-b border-gray-200 cursor-move flex items-center justify-between"
            onMouseDown={startDragging}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Color Picker (Drag to move)</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
              ✕
            </Button>
          </div>

          <div className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div
                  ref={colorFieldRef}
                  className="w-full h-40 rounded-md cursor-crosshair relative overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`,
                    backgroundImage: `
                      linear-gradient(to top, #000, transparent),
                      linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))
                    `,
                  }}
                  onMouseDown={(e) => {
                    isDraggingField.current = true
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = (e.clientX - rect.left) / rect.width
                    const y = (e.clientY - rect.top) / rect.height

                    setHsv((prev) => {
                      const newHsv = { ...prev, s: x, v: 1 - y }
                      const newColor = hsvToHex(newHsv)
                      onChange(newColor)
                      setInputValue(newColor)
                      return newHsv
                    })
                  }}
                >
                  <div
                    className="absolute w-6 h-6 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      left: `${hsv.s * 100}%`,
                      top: `${(1 - hsv.v) * 100}%`,
                      backgroundColor: hsvToHex(hsv),
                    }}
                  />
                </div>
              </div>

              <div
                ref={hueSliderRef}
                className="w-6 h-40 rounded-md cursor-pointer"
                style={{
                  background: "linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                }}
                onMouseDown={(e) => {
                  isDraggingHue.current = true
                  const rect = e.currentTarget.getBoundingClientRect()
                  const y = (e.clientY - rect.top) / rect.height

                  setHsv((prev) => {
                    const newHsv = { ...prev, h: 360 - Math.round(y * 360) }
                    const newColor = hsvToHex(newHsv)
                    onChange(newColor)
                    setInputValue(newColor)
                    return newHsv
                  })
                }}
              >
                <div
                  className="absolute w-10 h-6 rounded-full border-2 border-white transform -translate-x-2 -translate-y-1/2 pointer-events-none"
                  style={{
                    top: `${((360 - hsv.h) / 360) * 100}%`,
                    backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Input
                value={format === "HEX" ? inputValue : hsvToRgbaString(hsv)}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-1"
              />

              <Button variant="default" size="sm" onClick={() => setFormat("HEX")}>
                HEX
              </Button>

              <Button variant="outline" size="sm" onClick={() => setFormat("RGBa")}>
                RGBa
              </Button>

              <Button variant="outline" size="sm" onClick={generateRandomColor}>
                Random
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Popover>
  )
}

