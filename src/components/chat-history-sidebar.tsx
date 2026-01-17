"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Plus,
  Loader2,
} from "lucide-react"
import type { ChatHistory } from "@/services/chat-history.service"
import { chatHistoryService } from "@/services/chat-history.service"

interface ChatHistorySidebarProps {
  histories: ChatHistory[]
  currentHistoryId: string | null
  onSelectHistory: (historyId: string) => void
  onNewChat: () => void
  onHistoryUpdated: () => void
  isLoading?: boolean
}

export default function ChatHistorySidebar({
  histories,
  currentHistoryId,
  onSelectHistory,
  onNewChat,
  onHistoryUpdated,
  isLoading = false,
}: ChatHistorySidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleStartEdit = (history: ChatHistory) => {
    setEditingId(history.id)
    setEditName(history.name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const handleSaveEdit = async (historyId: string) => {
    if (!editName.trim()) return

    try {
      await chatHistoryService.updateName(historyId, editName.trim())
      setEditingId(null)
      setEditName("")
      onHistoryUpdated()
    } catch (error) {
      console.error("Failed to update chat history name:", error)
      alert("Failed to update chat name. Please try again.")
    }
  }

  const handleDelete = async (historyId: string) => {
    if (!confirm("Are you sure you want to delete this chat history?")) {
      return
    }

    setDeletingId(historyId)
    try {
      await chatHistoryService.delete(historyId)
      onHistoryUpdated()
      // If deleted history is currently active, start new chat
      if (currentHistoryId === historyId) {
        onNewChat()
      }
    } catch (error) {
      console.error("Failed to delete chat history:", error)
      alert("Failed to delete chat history. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const filteredHistories = histories.filter((history) =>
    history.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-border bg-background/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <Button
            onClick={onNewChat}
            size="sm"
            className="h-8"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>

      {/* Histories List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredHistories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No chats match your search"
                : "No chat history yet. Start a new conversation!"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHistories.map((history) => {
              const isActive = history.id === currentHistoryId
              const isEditing = editingId === history.id
              const isDeleting = deletingId === history.id

              return (
                <div
                  key={history.id}
                  className={`group relative rounded-lg border transition-colors ${
                    isActive
                      ? "bg-primary/10 border-primary/20"
                      : "bg-card border-border hover:bg-card/80"
                  }`}
                >
                  {isEditing ? (
                    <div className="p-2 flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit(history.id)
                          } else if (e.key === "Escape") {
                            handleCancelEdit()
                          }
                        }}
                        className="h-8 flex-1 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSaveEdit(history.id)}
                        disabled={!editName.trim()}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="p-3 cursor-pointer"
                      onClick={() => onSelectHistory(history.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium flex-1 line-clamp-2 break-words">
                          {history.name}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEdit(history)
                            }}
                            title="Edit name"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(history.id)
                            }}
                            disabled={isDeleting}
                            title="Delete"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(history.lastMessageAt)}</span>
                        <span>•</span>
                        <span>{history.messageCount} messages</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
