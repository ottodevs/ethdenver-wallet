"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import * as React from "react"

interface ResponsiveDialogProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  contentClassName?: string
}

export function ResponsiveDialog({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  className,
  contentClassName,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={cn("sm:max-w-md", contentClassName)}>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          <div className={className}>{children}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        {(title || description) && (
          <DrawerHeader>
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        )}
        <div className={cn("px-4", className)}>{children}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
} 