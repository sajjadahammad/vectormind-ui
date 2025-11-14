"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ChatInterface from "@/components/chat-interface"
import { LogOut, Settings, User } from "lucide-react"
import { authService } from "@/services/auth.service"

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
    } else {
      setUser(JSON.parse(userData))
    }
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push("/")
  }

  if (!user) return null

  return (
    <div className="grid-pattern relative h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/chat" className="text-2xl font-bold">
              <span className="text-foreground">Vector</span>
              <span className="text-primary">Mind</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 relative">
            {user.role === "admin" && (
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}

            <div className="relative">
              <Button
                onClick={() => setShowProfile(!showProfile)}
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-white"
              >
                <User className="w-4 h-4" />
              </Button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border/50 rounded-lg shadow-lg p-2 z-20">
                  <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border/50 mb-2">
                    {user.email}
                  </div>
                  <Button
                    onClick={handleLogout}
                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-white"
                    variant="ghost"
                    size="sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  )
}
