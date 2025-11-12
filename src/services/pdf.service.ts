import apiClient from "@/lib/api-client"

interface UploadResponse {
  message: string
  documentId: string
  filename: string
  pages: number
  chunks: number
  uploadedBy: string
  uploadedAt: string
}

interface PDFDocument {
  documentId: string
  filename: string
  pages: number
  chunks: number
  uploadedBy: string
  uploadedAt: string
  metadata?: Record<string, any>
}

export const pdfService = {
  async uploadPDF(file: File, metadata?: Record<string, any>) {
    const formData = new FormData()
    formData.append("pdf", file)
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata))
    }

    const response = await apiClient.post<UploadResponse>("/pdf/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },

  async listPDFs() {
    const response = await apiClient.get<{ pdfs: PDFDocument[]; count: number }>("/pdf/list")
    return response.data.pdfs
  },

  async deletePDF(documentId: string) {
    const response = await apiClient.delete(`/pdf/${documentId}`)
    return response.data
  },
}
