"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { authService } from "@/services/auth.service"

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token) {
      router.push("/chat")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await authService.login({ email, password })
      // localStorage.setItem("authToken", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      router.push("/chat")
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials. Contact your administrator for access.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid-pattern relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-card/50 backdrop-blur-sm border border-border/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-foreground">Vector</span>
              <span className="text-primary">Mind</span>
            </h1>
            <p className="text-muted-foreground text-sm">Internal Knowledge AI Assistant</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Admin only - ask your admin for credentials</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <span className="text-center text-xs text-muted-foreground">Test credentials email: sajjad08@gmail.com password: abc123</span>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Only admins can register new users. Contact your administrator.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
