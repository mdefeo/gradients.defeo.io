"use client"

import type React from "react"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  const { collapsed, setCollapsed } = useSidebar()

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-10",
        collapsed ? "w-12" : "w-[400px]",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "flex-1 overflow-auto",
            collapsed ? "hidden" : "block",
            // Hide scrollbar
            "scrollbar-hide",
          )}
        >
          {children}
        </div>
        <button
          className="absolute top-4 -right-4 bg-white border border-gray-200 rounded-full p-1 shadow-md"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

