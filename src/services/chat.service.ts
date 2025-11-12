import apiClient from "@/lib/api-client"

interface ChatMessage {
  message: string
  conversationId?: string
}

interface ChatSource {
  documentId: string
  filename: string
  pageNumber: number
  relevanceScore: number
}

interface ChatResponse {
  response: string
  sources: ChatSource[]
  conversationId: string
}

export const chatService = {
  async sendMessage(payload: ChatMessage) {
    const response = await apiClient.post<ChatResponse>("/chat", payload)
    return response.data
  },

  async streamMessage(payload: ChatMessage) {
    const response = await apiClient.post("/chat/stream", payload, {
      responseType: "text",
    })
    return response.data
  },
}
