"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import FileUploadArea from "@/components/file-upload-area"
import FileList from "@/components/file-list"
import UserManagement from "@/components/user-management"
import { ArrowLeft, LogOut, User } from "lucide-react"

interface File {
  id: string
  name: string
  size: number
  uploadedAt: Date
  type: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [files, setFiles] = useState<File[]>([
    {
      id: "1",
      name: "Company_Handbook_2024.pdf",
      size: 2458624,
      uploadedAt: new Date("2024-10-15"),
      type: "pdf",
    },
    {
      id: "2",
      name: "API_Documentation.docx",
      size: 1024000,
      uploadedAt: new Date("2024-10-14"),
      type: "docx",
    },
  ])
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
    } else {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== "admin") {
        router.push("/chat")
      }
      setUser(parsedUser)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleFileUpload = (newFiles: FileList) => {
    Array.from(newFiles).forEach((file) => {
      const newFile: File = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        type: file.type,
      }
      setFiles((prev) => [newFile, ...prev])
    })
  }

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  if (!user) return null

  return (
    <div className="grid-pattern relative min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Settings</h1>
              <p className="text-sm text-muted-foreground">Manage knowledge base and user access</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <Button
                onClick={() => setShowProfile(!showProfile)}
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-primary"
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
                    className="w-full justify-start text-destructive hover:bg-destructive/10"
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

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {/* Upload section */}
          <div className="md:col-span-1">
            <Card className="bg-card/50 border border-border/50 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Upload Files</h2>
              <FileUploadArea onFileUpload={handleFileUpload} />
            </Card>
          </div>

          {/* Files list */}
          <div className="md:col-span-2">
            <Card className="bg-card/50 border border-border/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Knowledge Base Files</h2>
                <span className="text-sm text-muted-foreground">{files.length} files</span>
              </div>
              <FileList files={files} onDeleteFile={handleDeleteFile} />
            </Card>
          </div>
        </div>

        {/* User management section */}
        <div className="max-w-7xl">
          <UserManagement />
        </div>
      </div>
    </div>
  )
}
