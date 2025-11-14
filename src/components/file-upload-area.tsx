"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, Loader2, CheckCircle, XCircle } from "lucide-react"
import { fileService } from "@/services/file.service"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface FileUploadAreaProps {
  onFileUpload?: (files: FileList) => void
}

export default function FileUploadArea({ onFileUpload }: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const {
    isPending,
    isSuccess,
    isError,
    isIdle,
    mutateAsync,
    reset,
    variables,
  } = useMutation({
    mutationFn: (file: File) => fileService.uploadFile(file, setUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] })
      setTimeout(() => {
        reset()
        setUploadProgress(0)
      }, 3000)
    },
    onError: () => {
      setTimeout(() => {
        reset()
        setUploadProgress(0)
      }, 3000)
    },
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    if (onFileUpload) {
      onFileUpload(files)
    }

    // Upload files to API
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      await mutateAsync(file)
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
        onClick={() => isIdle && inputRef.current?.click()}
        className={`border-2 border-dashed border-border/50 rounded-lg p-6 transition-colors ${
          isIdle ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {isIdle && (
            <>
              <Upload className="w-8 h-8 text-primary mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground">or click to select</p>
              <p className="text-xs text-muted-foreground mt-2">PDF, DOC, DOCX, TXT, MD, JSON</p>
            </>
          )}
          {isPending && (
            <>
              <Loader2 className="w-8 h-8 text-primary mb-2 animate-spin" />
              <p className="text-sm font-medium text-foreground mb-1">Uploading {variables?.name}...</p>
              <div className="w-full bg-border/50 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
            </>
          )}
          {isSuccess && (
            <>
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Upload successful!</p>
              <p className="text-xs text-muted-foreground">{variables?.name}</p>
            </>
          )}
          {isError && (
            <>
              <XCircle className="w-8 h-8 text-destructive mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Upload failed</p>
              <p className="text-xs text-muted-foreground">Please try again</p>
            </>
          )}
        </div>
      </div>

      <Button
        onClick={() => inputRef.current?.click()}
        disabled={!isIdle}
        className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <File className="w-4 h-4 mr-2" />
            Choose Files
          </>
        )}
      </Button>
    </div>
  )
}
