'use client'

import { cn } from '@/lib/utils/tailwind'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import type { ComponentRef } from 'react'
import * as React from 'react'

// Memoize primitive components
const DropdownMenu = React.memo(DropdownMenuPrimitive.Root)
const DropdownMenuTrigger = React.memo(DropdownMenuPrimitive.Trigger)
const DropdownMenuPortal = React.memo(DropdownMenuPrimitive.Portal)

// Memoize portal content renderer
const PortalContent = React.memo(
    React.forwardRef<
        ComponentRef<typeof DropdownMenuPrimitive.Content>,
        React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
    >(({ className, sideOffset = 4, ...props }, ref) => (
        <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                'z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
                'bg-popover text-popover-foreground',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className,
            )}
            {...props}
        />
    )),
)

// Optimize DropdownMenuContent
const DropdownMenuContent = React.memo(
    React.forwardRef<
        ComponentRef<typeof DropdownMenuPrimitive.Content>,
        React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
    >(({ ...props }, ref) => (
        <DropdownMenuPortal>
            <PortalContent ref={ref} {...props} />
        </DropdownMenuPortal>
    )),
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

// Memoize MenuItem with forwardRef
const DropdownMenuItem = React.memo(
    React.forwardRef<
        ComponentRef<typeof DropdownMenuPrimitive.Item>,
        React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
            inset?: boolean
        }
    >(({ className, inset, ...props }, ref) => (
        <DropdownMenuPrimitive.Item
            ref={ref}
            className={cn(
                'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none',
                'focus:bg-accent focus:text-accent-foreground',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                '[&>svg]:size-4 [&>svg]:shrink-0',
                inset && 'pl-8',
                className,
            )}
            {...props}
        />
    )),
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

// Memoize Label with forwardRef
const DropdownMenuLabel = React.memo(
    React.forwardRef<
        ComponentRef<typeof DropdownMenuPrimitive.Label>,
        React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
            inset?: boolean
        }
    >(({ className, inset, ...props }, ref) => (
        <DropdownMenuPrimitive.Label
            ref={ref}
            className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
            {...props}
        />
    )),
)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

// Memoize Separator with forwardRef
const DropdownMenuSeparator = React.memo(
    React.forwardRef<
        ComponentRef<typeof DropdownMenuPrimitive.Separator>,
        React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
    >(({ className, ...props }, ref) => (
        <DropdownMenuPrimitive.Separator ref={ref} className={cn('bg-muted -mx-1 my-1 h-px', className)} {...props} />
    )),
)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

// Export only what we need
export {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
}
