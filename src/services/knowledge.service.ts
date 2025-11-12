import apiClient from "@/lib/api-client"

interface KnowledgeResult {
  text: string
  score: number
  metadata: Record<string, any>
}

export const knowledgeService = {
  async searchKnowledge(query: string, limit = 10) {
    const response = await apiClient.get<{ results: KnowledgeResult[]; count: number }>("/knowledge/search", {
      params: { query, limit },
    })
    return response.data.results
  },

  async addKnowledge(text: string, metadata?: Record<string, any>) {
    const response = await apiClient.post("/knowledge/add", {
      text,
      metadata,
    })
    return response.data
  },
}
