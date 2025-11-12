"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export interface User {
  email: string
  role: "user" | "editor" | "admin"
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = (email: string, role: "user" | "editor" | "admin" = "user") => {
    const userData = { email, role }
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
    router.push("/chat")
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/")
  }

  const updateUserRole = (email: string, newRole: "user" | "editor" | "admin") => {
    const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]")
    const userIndex = allUsers.findIndex((u: User) => u.email === email)
    if (userIndex !== -1) {
      allUsers[userIndex].role = newRole
      localStorage.setItem("allUsers", JSON.stringify(allUsers))
      // Update current user if it's their role being changed
      if (user?.email === email) {
        setUser({ ...user, role: newRole })
        localStorage.setItem("user", JSON.stringify({ email, role: newRole }))
      }
      return true
    }
    return false
  }

  const requireAuth = () => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }

  const requireAdmin = () => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/chat")
    }
  }

  return { user, isLoading, login, logout, requireAuth, requireAdmin, updateUserRole }
}
