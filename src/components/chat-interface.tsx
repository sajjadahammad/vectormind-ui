"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Copy } from "lucide-react"
import { chatService } from "@/services/chat.service"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: Array<{ filename: string; pageNumber: number }>
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [showInitial, setShowInitial] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      chatService.sendMessage({
        message,
        conversationId: "default",
      }),
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        sources: data.sources.map((s) => ({
          filename: s.filename,
          pageNumber: s.pageNumber,
        })),
      }
      setMessages((prev) => [...prev, aiMessage])
      setShowInitial(false)
    },
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setShowInitial(false)

    await sendMessageMutation.mutateAsync(input)
  }

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showInitial && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground mb-2">Welcome to VectorMind</div>
              <div className="text-sm text-muted-foreground">Ask me anything about your internal knowledge base</div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                } rounded-lg overflow-hidden`}
              >
                <div className="px-4 py-3">
                  <p className="text-sm">{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs opacity-75">
                      <div className="font-semibold mb-1">Sources:</div>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="truncate">
                            📄 {source.filename} (Page {source.pageNumber})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Message actions for assistant */}
                {message.role === "assistant" && (
                  <div className="border-t border-border/50 px-4 py-2 flex items-center bg-card/50">
                    <Button
                      onClick={() => handleCopyMessage(message.content, message.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-card border border-border text-foreground px-4 py-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your internal knowledge..."
              disabled={sendMessageMutation.isPending}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending || !input.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
