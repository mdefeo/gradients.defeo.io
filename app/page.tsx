"use client"

import GradientGenerator from "@/components/gradient-generator"
import { Sidebar } from "@/components/sidebar"
import { SidebarProvider, useSidebar } from "@/components/sidebar-context"
import { useEffect, useState } from "react"

// Update the DEFAULT_GRADIENT_STYLE to use backgroundImage instead of background
const DEFAULT_GRADIENT_STYLE = {
  backgroundImage: "linear-gradient(90deg, #ff5f6d 0%, #ffc371 100%)",
  backgroundSize: "100% 100%",
}

function GradientContent() {
  const { collapsed } = useSidebar()
  const [gradientStyle, setGradientStyle] = useState(DEFAULT_GRADIENT_STYLE)

  // Get the gradient style from localStorage on component mount
  useEffect(() => {
    const savedGradient = localStorage.getItem("gradientStyle")
    if (savedGradient) {
      try {
        setGradientStyle(JSON.parse(savedGradient))
      } catch (e) {
        // If parsing fails, use the default gradient
        setGradientStyle(DEFAULT_GRADIENT_STYLE)
      }
    }
  }, [])

  // Listen for custom event to update gradient
  useEffect(() => {
    const handleGradientChange = (e: CustomEvent) => {
      setGradientStyle(e.detail)
    }

    window.addEventListener("gradientChange" as any, handleGradientChange)

    return () => {
      window.removeEventListener("gradientChange" as any, handleGradientChange)
    }
  }, [])

  return (
    <div
      className="min-h-screen transition-all duration-300 flex-1"
      style={{
        marginLeft: collapsed ? "3rem" : "400px",
        ...gradientStyle,
      }}
    />
  )
}

export default function Home() {
  return (
    <SidebarProvider>
      <main className="min-h-screen flex">
        <Sidebar>
          <GradientGenerator />
        </Sidebar>
        <GradientContent />
      </main>
    </SidebarProvider>
  )
}

