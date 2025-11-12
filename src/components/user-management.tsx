"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Shield, Edit2, Check, X } from "lucide-react"

interface User {
  email: string
  role: "user" | "editor" | "admin"
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<"user" | "editor" | "admin">("user")

  useEffect(() => {
    // Load users from localStorage
    const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]")
    setUsers(allUsers)
  }, [])

  const handleRoleChange = (email: string, role: "user" | "editor" | "admin") => {
    setEditingEmail(email)
    setNewRole(role)
  }

  const handleSaveRole = (email: string) => {
    const updatedUsers = users.map((u) => (u.email === email ? { ...u, role: newRole } : u))
    setUsers(updatedUsers)
    localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
    setEditingEmail(null)
  }

  const handleDeleteUser = (email: string) => {
    const updatedUsers = users.filter((u) => u.email !== email)
    setUsers(updatedUsers)
    localStorage.setItem("allUsers", JSON.stringify(updatedUsers))
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "editor":
        return "bg-primary/20 text-primary border-primary/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Full access including user management"
      case "editor":
        return "Can upload and manage knowledge base files"
      default:
        return "Read-only access to chat"
    }
  }

  return (
    <Card className="bg-card/50 border border-border/50 p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            User Access Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Control who can edit the knowledge base</p>
        </div>
        <span className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
          {users.length} users
        </span>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users yet. Users will appear here after registration.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.email}
              className="flex items-center justify-between p-4 bg-background/50 border border-border/30 rounded-lg hover:border-border/50 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{getRoleDescription(user.role)}</p>
              </div>

              <div className="flex items-center gap-3">
                {editingEmail === user.email ? (
                  <>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as "user" | "editor" | "admin")}
                      className="text-xs px-2 py-1 bg-background border border-border/50 rounded text-foreground"
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      onClick={() => handleSaveRole(user.email)}
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:bg-primary/10"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setEditingEmail(null)}
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                    <Button
                      onClick={() => handleRoleChange(user.email, user.role)}
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteUser(user.email)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Role Permissions:</p>
        <ul className="space-y-1 text-xs">
          <li>
            • <span className="text-foreground font-medium">User:</span> View chat and interact with knowledge base
          </li>
          <li>
            • <span className="text-foreground font-medium">Editor:</span> Upload and manage knowledge base files
          </li>
          <li>
            • <span className="text-foreground font-medium">Admin:</span> Full access including user management
          </li>
        </ul>
      </div>
    </Card>
  )
}
