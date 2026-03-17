import React, { useState } from "react"
import { Copy, User, Phone, Building, Shield, LogOut, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { fetchOnboardingProfile } from "@/services/onboarding.service"

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user, logout } = useAuth()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [profileRole, setProfileRole] = useState<string | null>(null)
  const [profileCompany, setProfileCompany] = useState<string | null>(null)

  React.useEffect(() => {
    if (!open) setCopiedField(null)
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const token = localStorage.getItem("token")
    if (!token) return

    fetchOnboardingProfile(token)
      .then((data) => {
        setProfileRole(data.role)
        setProfileCompany(data.company)
      })
      .catch(() => {
        setProfileRole(null)
        setProfileCompany(null)
      })
  }, [open])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  const handleLogout = () => {
    logout()
    onOpenChange(false)
  }

  if (!user) {
    return null
  }

  const resolvedRole = profileRole || user?.role || "Not provided"
  const resolvedCompany = profileCompany || user?.organization

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-[#0B0D10] via-[#111315] to-[#0B0D10] border-[#9FA4B7]/20 text-white p-0 overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] transition-all duration-200 hover:shadow-[0_30px_100px_rgba(0,0,0,0.95)]">
        <div className="relative">
          {/* Premium header with metallic gradient */}
          <div className="relative bg-gradient-to-br from-[#111315] via-[#0B0D10] to-[#111315] p-6 pb-4 overflow-hidden">
            {/* Subtle metallic sheen overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9CCD6]/5 to-transparent opacity-60" />
            {/* Top-right light reflection */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-radial from-[#C9CCD6]/10 to-transparent rounded-full blur-xl" />

            <DialogHeader className="space-y-3 relative z-10">
              <DialogTitle className="text-xl font-semibold text-[#C9CCD6] tracking-wide">
                Profile
              </DialogTitle>
              <DialogDescription className="text-[#9FA4B7]/80 font-light">
                Your account information and settings
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4 mt-4 relative z-10">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-[#9FA4B7]/30 shadow-[0_0_20px_rgba(159,164,183,0.15)]">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[#111315] to-[#0B0D10] text-[#C9CCD6] text-lg font-semibold border border-[#9FA4B7]/20">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                {/* Metallic ring glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#C9CCD6]/20 via-transparent to-[#9FA4B7]/20 blur-sm" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[#C9CCD6] truncate tracking-wide">
                  {user?.name}
                </h3>
                <p className="text-sm text-[#9FA4B7]/80 truncate font-light">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Profile details with glass effect */}
          <div className="p-6 space-y-4 bg-gradient-to-b from-[#0B0D10]/50 to-[#111315]/50 backdrop-blur-sm">
            {/* Inner highlight for glass effect */}
            <div className="absolute inset-x-6 top-[140px] h-px bg-gradient-to-r from-transparent via-[#9FA4B7]/20 to-transparent" />

            <div className="flex items-center gap-3 transition-all duration-200 hover:bg-[#111315]/30 rounded-lg p-2 -m-2">
              <Shield className="h-4 w-4 text-[#9FA4B7]/60" />
              <div className="flex-1">
                <p className="text-xs text-[#9FA4B7]/50 uppercase tracking-widest font-medium">
                  Role
                </p>
                <p className="text-sm text-[#C9CCD6] tracking-wide">{resolvedRole}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 transition-all duration-200 hover:bg-[#111315]/30 rounded-lg p-2 -m-2">
                <Phone className="h-4 w-4 text-[#9FA4B7]/60" />
                <div className="flex-1">
                  <p className="text-xs text-[#9FA4B7]/50 uppercase tracking-widest font-medium">
                    Phone
                  </p>
                  <p className="text-sm text-[#C9CCD6] tracking-wide">{user.phone}</p>
                </div>
              </div>
            )}

            {resolvedCompany && (
              <div className="flex items-center gap-3 transition-all duration-200 hover:bg-[#111315]/30 rounded-lg p-2 -m-2">
                <Building className="h-4 w-4 text-[#9FA4B7]/60" />
                <div className="flex-1">
                  <p className="text-xs text-[#9FA4B7]/50 uppercase tracking-widest font-medium">
                    Company
                  </p>
                  <p className="text-sm text-[#C9CCD6] tracking-wide">{resolvedCompany}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 transition-all duration-200 hover:bg-[#111315]/30 rounded-lg p-2 -m-2">
              <div className="h-4 w-4 flex items-center justify-center">
                <div className={cn(
                  "h-2 w-2 rounded-full transition-all duration-200",
                  user?.status === "active"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                )} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#9FA4B7]/50 uppercase tracking-widest font-medium">
                  Status
                </p>
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200",
                  user?.status === "active"
                    ? "bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 text-emerald-300 border-emerald-500/30 shadow-[inset_0_1px_0_rgba(16,185,129,0.1)]"
                    : "bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-300 border-red-500/30 shadow-[inset_0_1px_0_rgba(239,68,68,0.1)]"
                )}>
                  {user?.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Premium footer with glass buttons */}
          <div className="border-t border-[#9FA4B7]/10 p-6 flex gap-3 bg-gradient-to-b from-[#111315]/60 to-[#0B0D10]/60 backdrop-blur-sm">
            <Button
              variant="outline"
              className="flex-1 bg-gradient-to-b from-[#111315]/80 to-[#0B0D10]/80 border-[#9FA4B7]/30 text-[#C9CCD6] hover:bg-gradient-to-b hover:from-[#9FA4B7]/10 hover:to-[#111315]/90 hover:border-[#C9CCD6]/40 transition-all duration-200 hover:shadow-[0_0_20px_rgba(159,164,183,0.1)] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(201,204,214,0.1)]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              className="flex-1 bg-gradient-to-b from-red-900/80 to-red-800/80 hover:bg-gradient-to-b hover:from-red-800/90 hover:to-red-700/90 text-white border border-red-700/40 hover:border-red-600/60 transition-all duration-200 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] shadow-[inset_0_1px_0_rgba(248,113,113,0.1)]"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UserProfileDialog