"use client"

import { Trash2, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fileService } from "@/services/file.service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface File {
  id: string
  filename: string
  pages: number
  chunks: number
  uploadedBy: string
  uploadedAt: string
  metadata?: Record<string, any>
}

interface FileListProps {
  files?: File[]
  onDeleteFile?: (id: string) => void
}

const getFileIcon = (filename: string) => {
  if (filename.endsWith(".pdf")) return "📄"
  if (filename.endsWith(".doc") || filename.endsWith(".docx")) return "📝"
  if (filename.endsWith(".txt")) return "📋"
  return "📎"
}

export default function FileList({ files: propFiles, onDeleteFile }: FileListProps) {
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null)

  // Fetch files from API if not provided
  const { data: apiFiles, isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => fileService.listFiles(),
    enabled: !propFiles,
  })

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] })
      setDeleteDialogOpen(false)
      setFileToDelete(null)
    },
  })

  const handleDeleteClick = (fileId: string, filename: string) => {
    setFileToDelete({ id: fileId, name: filename })
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      if (onDeleteFile) {
        onDeleteFile(fileToDelete.id)
      }
      deleteMutation.mutate(fileToDelete.id)
    }
  }

  const files = propFiles || apiFiles || []

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
        <p className="text-muted-foreground">Loading files...</p>
      </div>
    )
  }

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
            <span className="text-xl">{getFileIcon(file.filename)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.filename}
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{file.pages} pages</span>
                <span>•</span>
                <span>{file.chunks} chunks</span>
                <span>•</span>
                <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={() => handleDeleteClick(file.id, file.filename)}
              disabled={deleteMutation.isPending && fileToDelete?.id === file.id}
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
            >
              {deleteMutation.isPending && fileToDelete?.id === file.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{fileToDelete?.name}</span> from the knowledge base. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
