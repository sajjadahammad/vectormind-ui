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

interface StreamCallbacks {
  onContent: (content: string) => void
  onSources?: (sources: ChatSource[]) => void
  onComplete: () => void
  onError: (error: string) => void
}

export const chatService = {
  async sendMessage(payload: ChatMessage) {
    const response = await apiClient.post<ChatResponse>("/chat", payload)
    return response.data
  },

  async streamMessage(payload: ChatMessage, callbacks: StreamCallbacks) {
    try {
      // Build headers using apiClient's defaults and interceptors
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      
      // Get token from localStorage (same as apiClient interceptor)
      const token = localStorage.getItem("authToken")
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${apiClient.defaults.baseURL}/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          callbacks.onComplete()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            
            if (data === "[DONE]") {
              callbacks.onComplete()
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.chunk) {
                callbacks.onContent(parsed.chunk)
              }
              
              if (parsed.done) {
                callbacks.onComplete()
                return
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error.message : "Unknown error")
    }
  },
}
