'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/features/shared/hooks/use-media-query'
import { cn } from '@/lib/utils/tailwind'
import { X } from 'lucide-react'
import * as React from 'react'

interface ResponsiveDialogProps {
    children: React.ReactNode
    trigger?: React.ReactNode
    title?: string
    description?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    className?: string
    contentClassName?: string
    hideCloseButton?: boolean
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
    hideCloseButton = false,
}: ResponsiveDialogProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)')

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent className={cn('sm:max-w-md', contentClassName)}>
                    <DialogHeader>
                        {title && <DialogTitle>{title}</DialogTitle>}
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                    <div className={className}>{children}</div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground snapPoints={[0.95]}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent className={cn(contentClassName)}>
                {!hideCloseButton && (
                    <div className='absolute top-4 right-4 z-50'>
                        <DrawerClose asChild>
                            <button className='rounded-full bg-[#373747] p-1.5 text-white hover:bg-[#444458] focus:outline-none'>
                                <X className='h-4 w-4' />
                            </button>
                        </DrawerClose>
                    </div>
                )}
                <DrawerHeader>
                    {title && <DrawerTitle>{title}</DrawerTitle>}
                    {description && <DrawerDescription>{description}</DrawerDescription>}
                </DrawerHeader>
                <div className={cn('px-4', className)}>{children}</div>
                <DrawerFooter />
            </DrawerContent>
        </Drawer>
    )
}
