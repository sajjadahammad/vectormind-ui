"use client"

import { Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface File {
  id: string
  name: string
  size: number
  uploadedAt: Date
  type: string
}

interface FileListProps {
  files: File[]
  onDeleteFile: (id: string) => void
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return "📄"
  if (type.includes("word") || type.includes("document")) return "📝"
  if (type.includes("text")) return "📋"
  return "📎"
}

export default function FileList({ files, onDeleteFile }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No files uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-3 bg-background/50 border border-border/50 rounded-lg hover:bg-background/80 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xl">{getFileIcon(file.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{file.uploadedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={() => onDeleteFile(file.id)}
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
