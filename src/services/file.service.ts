import apiClient from "@/lib/api-client"

interface UploadedFile {
  id: string
  filename: string
  pages: number
  chunks: number
  uploadedBy: string
  uploadedAt: string
  metadata?: Record<string, any>
}

interface FileListResponse {
  pdfs: UploadedFile[]
  count: number
}

export const fileService = {
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append("pdf", file)

    const response = await apiClient.post<{
      message: string
      documentId: string
      filename: string
      pages: number
      chunks: number
      uploadedBy: string
      uploadedAt: string
    }>("/pdf/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return {
      documentId: response.data.documentId,
      filename: response.data.filename,
      pages: response.data.pages,
      chunks: response.data.chunks,
      uploadedBy: response.data.uploadedBy,
      uploadedAt: response.data.uploadedAt,
    }
  },

  async listFiles() {
    const response = await apiClient.get<FileListResponse>("/pdf/list")
    return response.data.pdfs
  },

  async deleteFile(documentId: string) {
    const response = await apiClient.delete(`/pdf/${documentId}`)
    return response.data
  },
}
