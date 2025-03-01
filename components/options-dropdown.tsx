"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWallet } from "@/hooks/use-wallet"
import { Copy, ExternalLink, LogOut, Moon, MoreVertical, Settings, Shield, Sun } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { DelegatedApproval } from "./delegated-approval"

export function OptionsDropdown() {
  const { setTheme, theme } = useTheme()
  const { walletAddress, disconnect } = useWallet()
  const [delegatedApprovalOpen, setDelegatedApprovalOpen] = useState(false)

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
  }

  const handleLogout = async () => {
    try {
      // First disconnect from Okto
      disconnect()
      
      // Then sign out from Next-Auth
      await signOut({ redirect: true, callbackUrl: "/auth/signin" })
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleCopyAddress}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDelegatedApprovalOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Automatic Approvals
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DelegatedApproval 
        open={delegatedApprovalOpen} 
        onOpenChange={setDelegatedApprovalOpen} 
      />
    </>
  )
}

