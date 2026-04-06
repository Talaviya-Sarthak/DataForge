import React, { useState } from "react"
import { Phone, Building, Shield, LogOut, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { fetchOnboardingProfile } from "@/services/onboarding.service"
import { getAccessToken } from "@/services/api.client"

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user, logout } = useAuth()
  const [profileRole, setProfileRole] = useState<string | null>(null)
  const [profileCompany, setProfileCompany] = useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    const token = getAccessToken()
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
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 p-0 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
        <div className="relative">
          <div className="border-b border-zinc-800 bg-zinc-950 p-6 pb-4">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-medium text-zinc-100 tracking-tight">
                Profile
              </DialogTitle>
              <DialogDescription className="text-zinc-400 font-normal">
                Your account information and settings
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border border-zinc-700">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-zinc-900 text-zinc-100 text-lg font-medium border border-zinc-700">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-zinc-100 truncate tracking-tight">
                  {user?.name}
                </h3>
                <p className="text-sm text-zinc-400 truncate font-normal">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 bg-zinc-950">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <Shield className="h-4 w-4 text-zinc-400" />
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                  Role
                </p>
                <p className="text-sm text-zinc-100 tracking-tight">{resolvedRole}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <Phone className="h-4 w-4 text-zinc-400" />
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                    Phone
                  </p>
                  <p className="text-sm text-zinc-100 tracking-tight">{user.phone}</p>
                </div>
              </div>
            )}

            {resolvedCompany && (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <Building className="h-4 w-4 text-zinc-400" />
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                    Company
                  </p>
                  <p className="text-sm text-zinc-100 tracking-tight">{resolvedCompany}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="h-4 w-4 flex items-center justify-center">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  user?.status === "active"
                    ? "bg-emerald-500"
                    : "bg-red-500"
                )} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                  Status
                </p>
                <span className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                  user?.status === "active"
                    ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-300"
                    : "border-red-700/50 bg-red-900/20 text-red-300"
                )}>
                  {user?.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-zinc-800 bg-zinc-950 p-6">
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              className="flex-1 border border-red-700/50 bg-red-900/60 text-red-100 hover:bg-red-900/80 hover:border-red-600/60"
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
