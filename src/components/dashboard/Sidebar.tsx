"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  Home,
  LineChart,
  Settings,
  Target,
  ArrowLeft
} from "lucide-react"
import { View } from "@/types/types"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState } from "react"

interface SidebarProps {
  className?: string
  clientName: string
  onNavigate: (view: View) => void
  currentView: View
}

export function Sidebar({ className, clientName, onNavigate, currentView }: SidebarProps) {
  const { theme, resolvedTheme } = useTheme()
  
  
  // Determine which drone SVG to use based on theme
  const droneLogoSrc = 
    theme === "dark" || resolvedTheme === "dark" 
      ? "/whitedrone.svg" 
      : "/drone.svg"
  
  // Determine if we're in dark mode for conditional styling
  const isDarkMode = theme === "dark" || resolvedTheme === "dark"
  
  // Define hover styles based on theme
  const hoverBgClass = isDarkMode ? "hover:bg-[#202224]" : "hover:bg-gray-200"
  const hoverTextClass = isDarkMode ? "hover:text-white" : "hover:text-black"
  
  // Define selected/focused styles based on theme
  const focusBgClass = isDarkMode ? "bg-[#202224]" : "bg-gray-200"
  const focusTextClass = isDarkMode ? "text-white" : "text-black"
  
  return (
    <div className={cn("flex flex-col h-screen border-r bg-background", className)}>
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold items-center truncate">
            Logo
          </h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {/* Summary button with custom focus styling */}
          <Button 
            variant={currentView === 'summary' ? "ghost" : "ghost"} 
            className={cn(
              "w-full justify-start h-12 text-base transition-colors",
              currentView === 'summary' 
                ? [focusBgClass, focusTextClass] 
                : [hoverBgClass, hoverTextClass]
            )}
            onClick={() => onNavigate('summary')}
          >
            <LineChart className="mr-3 h-5 w-5" />
            Summary
          </Button>
          
          {/* Configuration button with custom focus styling */}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start h-12 text-base transition-colors",
              currentView === 'config' 
                ? [focusBgClass, focusTextClass] 
                : [hoverBgClass, hoverTextClass]
            )}
            onClick={() => onNavigate('config')}
          >
            <Settings className="mr-3 h-5 w-5" />
            Configuration
          </Button>
          
          {/* Mission button with custom focus styling */}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start h-12 text-base transition-colors",
              currentView === 'mission' 
                ? [focusBgClass, focusTextClass] 
                : [hoverBgClass, hoverTextClass]
            )}
            onClick={() => onNavigate('mission')}
          >
            <Target className="mr-3 h-5 w-5" />
            Mission
          </Button>
          
          {/* Drones button with updated hover styling*/}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start h-12 text-base transition-colors",
              hoverBgClass, 
              hoverTextClass
            )}
            onClick={() => onNavigate('summary')}
        
          >
            <div className="mr-3 ml-[-4px] pr-1 h-5 w-5 flex items-center justify-center">
              <Image
                src={droneLogoSrc}
                alt="Drone"
                width={18}
                height={18}
                className="transition-all duration-150"
              />
            </div>
            Drones
          </Button>
        </div>
      </ScrollArea>

      <div className="mt-auto p-4">
        {/* Black background with white text for Back to Home button */}
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-start h-12 text-base transition-colors",
            isDarkMode 
              ? "hover:bg-[#202224] hover:text-white" 
              : "bg-black text-white hover:bg-gray-800 hover:text-white"
          )}
          asChild
        >
          <Link href="/">
            <Home className="mr-3 h-5 w-5" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}