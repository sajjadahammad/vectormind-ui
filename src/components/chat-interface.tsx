"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Copy, Check } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatInterface() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)
    setStreamingContent("")

    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${backendUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: currentInput,
          conversationId: "default",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              try {
                const parsed = JSON.parse(data)
                // Handle your backend's response format
                if (parsed.type === "content" && parsed.content) {
                  assistantContent += parsed.content
                  setStreamingContent(assistantContent)
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent("")
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your message.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const displayMessages = streamingContent
    ? [
        ...messages,
        {
          id: "streaming",
          role: "assistant" as const,
          content: streamingContent,
        },
      ]
    : messages

  return (
    <div className="flex h-screen flex-col max-w-4xl mx-auto">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground mb-2">
                Welcome to VectorMind
              </div>
              <div className="text-sm text-muted-foreground">
                Ask me anything about your internal knowledge base
              </div>
            </div>
          </div>
        ) : (
          displayMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                } rounded-lg overflow-hidden`}
              >
                <div className="px-4 py-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                    {message.role === "assistant" && message.id === "streaming" && (
                      <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                    )}
                  </p>
                </div>

                {/* Message actions for assistant */}
                {message.role === "assistant" && message.id !== "streaming" && (
                  <div className="border-t border-border/50 px-4 py-2 flex items-center bg-card/50">
                    <Button
                      onClick={() => handleCopyMessage(message.content, message.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
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
              disabled={isLoading}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
