import apiClient from "@/lib/api-client"

export interface ChatHistory {
  id: string
  userId: string
  name: string
  conversationId: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string
  messageCount: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{
    filename: string
    pageNumber: number
    score: number
  }>
  timestamp: string
}

export interface ChatHistoryWithMessages extends ChatHistory {
  messages: ChatMessage[]
}

export interface ChatHistoriesResponse {
  histories: ChatHistory[]
  count: number
}

export const chatHistoryService = {
  /**
   * Get all chat histories for the current user
   */
  async getAll(): Promise<ChatHistoriesResponse> {
    try {
      const response = await apiClient.get<ChatHistoriesResponse>("/chat/history")
      console.log("Chat history API response:", response.data)
      return response.data
    } catch (error: any) {
      console.error("Chat history API error:", error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Get a specific chat history with all messages
   */
  async getById(historyId: string): Promise<ChatHistoryWithMessages> {
    const response = await apiClient.get<ChatHistoryWithMessages>(
      `/chat/history/${historyId}`
    )
    return response.data
  },

  /**
   * Update chat history name
   */
  async updateName(historyId: string, name: string): Promise<ChatHistory> {
    const response = await apiClient.put<ChatHistory>(
      `/chat/history/${historyId}/name`,
      { name }
    )
    return response.data
  },

  /**
   * Delete a chat history
   */
  async delete(historyId: string): Promise<{ message: string; historyId: string }> {
    const response = await apiClient.delete<{ message: string; historyId: string }>(
      `/chat/history/${historyId}`
    )
    return response.data
  },
}
