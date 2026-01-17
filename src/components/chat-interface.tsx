"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Copy, Check, Menu, X } from "lucide-react"
import ChatHistorySidebar from "@/components/chat-history-sidebar"
import MarkdownMessage from "@/components/markdown-message"
import type { ChatHistory, ChatMessage as ChatHistoryMessage } from "@/services/chat-history.service"
import { chatHistoryService } from "@/services/chat-history.service"

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
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([])
  const [isLoadingHistories, setIsLoadingHistories] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Fetch chat histories on mount
  useEffect(() => {
    fetchChatHistories()
  }, [])

  const fetchChatHistories = async () => {
    setIsLoadingHistories(true)
    try {
      const data = await chatHistoryService.getAll()
      console.log("Chat histories fetched:", data)
      // Handle both array and object response formats
      if (Array.isArray(data)) {
        setChatHistories(data)
      } else if (data?.histories) {
        setChatHistories(data.histories)
      } else {
        console.warn("Unexpected response format:", data)
        setChatHistories([])
      }
    } catch (error) {
      console.error("Failed to fetch chat histories:", error)
      // Set empty array on error to show empty state
      setChatHistories([])
    } finally {
      setIsLoadingHistories(false)
    }
  }

  const handleNewChat = () => {
    setCurrentHistoryId(null)
    setMessages([])
    setStreamingContent("")
  }

  const handleSelectHistory = async (historyId: string) => {
    try {
      const history = await chatHistoryService.getById(historyId)
      setCurrentHistoryId(history.id)
      
      // Convert ChatHistoryMessage[] to Message[]
      const convertedMessages: Message[] = history.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }))
      
      setMessages(convertedMessages)
      setStreamingContent("")
    } catch (error) {
      console.error("Failed to load chat history:", error)
      if (error instanceof Error && error.message.includes("404")) {
        alert("Chat history not found. It may have been deleted.")
        fetchChatHistories()
      }
    }
  }

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      // Use requestAnimationFrame and setTimeout to ensure DOM is fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
          })
        }, 50)
      })
    }
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
      
      // Build request body with optional historyId
      const requestBody: any = {
        message: currentInput,
      }
      
      if (currentHistoryId) {
        requestBody.historyId = currentHistoryId
      }

      const response = await fetch(`${backendUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""
      let buffer = ""
      let newHistoryId = currentHistoryId

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()
              
              if (data === "[DONE]") {
                break
              }

              try {
                const parsed = JSON.parse(data)
                console.log("Received stream data:", parsed)
                
                // Handle chunk format: {chunk: "..."}
                if (parsed.chunk) {
                  assistantContent += parsed.chunk
                  setStreamingContent(assistantContent)
                  // Check for historyId in chunk responses
                  if (parsed.historyId && !currentHistoryId) {
                    newHistoryId = parsed.historyId
                    setCurrentHistoryId(parsed.historyId)
                  }
                }
                // Handle content format: {type: "content", content: "..."}
                else if (parsed.type === "content" && parsed.content) {
                  assistantContent += parsed.content
                  setStreamingContent(assistantContent)
                  // Check for historyId in content responses
                  if (parsed.historyId && !currentHistoryId) {
                    newHistoryId = parsed.historyId
                    setCurrentHistoryId(parsed.historyId)
                  }
                }
                // Handle message format: {type: "message", content: {parts: [...]}}
                else if (parsed.type === "message" && parsed.content) {
                  // Extract text from content.parts array (for assistant messages)
                  if (parsed.role === "assistant" || parsed.content.role === "assistant") {
                    const parts = parsed.content.parts || []
                    const textParts = parts
                      .filter((part: any) => part.type === "text" && part.text)
                      .map((part: any) => part.text)
                    if (textParts.length > 0) {
                      const newText = textParts.join("")
                      assistantContent += newText
                      setStreamingContent(assistantContent)
                    }
                  }
                }
                // Handle text-delta format (AI SDK format): {type: "text-delta", delta: "..."}
                else if (parsed.type === "text-delta" && parsed.delta) {
                  assistantContent += parsed.delta
                  setStreamingContent(assistantContent)
                }
                // Handle text-start format (AI SDK format): {type: "text-start", id: "..."}
                else if (parsed.type === "text-start") {
                  // Just mark that streaming started
                  if (!assistantContent) {
                    setStreamingContent("")
                  }
                }
                // Handle done flag - save historyId if present
                else if (parsed.type === "done" || parsed.done) {
                  if (parsed.historyId) {
                    newHistoryId = parsed.historyId
                    if (!currentHistoryId) {
                      setCurrentHistoryId(parsed.historyId)
                    }
                  }
                  break
                } else {
                  // Log unrecognized format for debugging
                  console.warn("Unrecognized stream format:", parsed)
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
                console.debug("Parse error (expected for incomplete chunks):", e)
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent || "",
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent("")
      
      // Always refresh chat histories after message completion
      // This updates message counts and adds new histories
      setTimeout(() => {
        fetchChatHistories()
      }, 500)
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

  // Show thinking indicator when loading but no content yet
  const showThinkingIndicator = isLoading && !streamingContent
  
  // Always include streaming message if loading or has content
  const displayMessages = isLoading || streamingContent
    ? [
        ...messages,
        {
          id: "streaming",
          role: "assistant" as const,
          content: streamingContent || "",
        },
      ]
    : messages
  
  // Check if we have actual messages (not just empty welcome state)
  const hasActualMessages = messages.length > 0 || (isLoading || streamingContent)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat History Sidebar */}
      {sidebarOpen && (
        <div className={`${sidebarOpen ? "block" : "hidden"} fixed md:relative inset-y-0 left-0 z-30 md:z-auto`}>
          <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-20" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-30 h-full">
            <ChatHistorySidebar
              histories={chatHistories}
              currentHistoryId={currentHistoryId}
              onSelectHistory={(id) => {
                handleSelectHistory(id)
                // Only close sidebar on mobile after selection
                if (isMobile) {
                  setSidebarOpen(false)
                }
              }}
              onNewChat={() => {
                handleNewChat()
                // Only close sidebar on mobile
                if (isMobile) {
                  setSidebarOpen(false)
                }
              }}
              onHistoryUpdated={fetchChatHistories}
              isLoading={isLoadingHistories}
            />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Sidebar toggle button - visible on all screen sizes */}
        <div className="absolute top-4 left-4 z-20">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="sm"
            className="bg-background/80 backdrop-blur-sm border border-border"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
        {/* Messages area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-2 md:p-4 pt-14 md:pt-14"
        >
          {!hasActualMessages ? (
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
            <div className="flex flex-col justify-end min-h-full space-y-4">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`inline-flex flex-col max-w-[85%] sm:max-w-2xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  } rounded-lg overflow-hidden`}
                >
                  <div className="px-3 py-2 sm:px-4 sm:py-3 break-words">
                    {message.role === "assistant" && message.id === "streaming" && showThinkingIndicator ? (
                      <div className="flex items-center gap-1 py-1">
                        <span className="text-sm text-muted-foreground">Thinking</span>
                        <div className="flex gap-1 ml-2">
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                        </div>
                      </div>
                    ) : message.role === "assistant" ? (
                      <div className="text-sm">
                        {message.content ? (
                          <MarkdownMessage content={message.content} />
                        ) : message.id === "streaming" ? (
                          <span className="text-muted-foreground">...</span>
                        ) : null}
                        {message.id === "streaming" && !showThinkingIndicator && message.content && (
                          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
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
            ))}
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm p-2 sm:p-4">
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
    </div>
  )
}
