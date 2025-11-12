"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File } from "lucide-react"

interface FileUploadAreaProps {
  onFileUpload: (files: FileList) => void
}

export default function FileUploadArea({ onFileUpload }: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFileUpload(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.json"
      />

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border/50 rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-8 h-8 text-primary mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Drag & drop files here</p>
          <p className="text-xs text-muted-foreground">or click to select</p>
          <p className="text-xs text-muted-foreground mt-2">PDF, DOC, DOCX, TXT, MD, JSON</p>
        </div>
      </div>

      <Button
        onClick={() => inputRef.current?.click()}
        className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <File className="w-4 h-4 mr-2" />
        Choose Files
      </Button>
    </div>
  )
}
