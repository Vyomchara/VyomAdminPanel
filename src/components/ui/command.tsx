"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Create a simpler Command component that doesn't rely on cmdk
const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Command.displayName = "Command"

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="flex h-9 items-center gap-2 border-b px-3">
    <SearchIcon className="h-4 w-4 shrink-0 opacity-50" />
    <input
      ref={ref}
      className={cn(
        "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
      className
    )}
    {...props}
  />
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-6 text-center text-sm", className)}
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    selected?: boolean, 
    disabled?: boolean,
    value?: string,
    onSelect?: (value: string) => void 
  }
>(({ className, selected, disabled, value, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
      selected && "bg-accent text-accent-foreground",
      disabled && "pointer-events-none opacity-50",
      className
    )}
    data-selected={selected || undefined}
    data-disabled={disabled || undefined}
    onClick={() => onSelect && value && onSelect(value)}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-border -mx-1 h-px", className)}
    {...props}
  />
))
CommandSeparator.displayName = "CommandSeparator"

function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

// Export components
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
