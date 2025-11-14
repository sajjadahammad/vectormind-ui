"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, Check, X, UserPlus, Loader2 } from "lucide-react"
import { authService } from "@/services/auth.service"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

// Zod schema for user creation form
const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  displayName: z.string().optional(),
})

interface User {
  uid: string
  email: string
  displayName: string
  role: string
  canUpload: boolean
  createdAt: string
}

type CreateUserFormData = z.infer<typeof createUserSchema>

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [showAddUser, setShowAddUser] = useState(false)

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
    mode:"onTouched"
  })

  // Fetch users from API
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => authService.listUsers(),
  })

  // Grant permission mutation
  const grantPermissionMutation = useMutation({
    mutationFn: (userId: string) => authService.grantPermission(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  // Revoke permission mutation
  const revokePermissionMutation = useMutation({
    mutationFn: (userId: string) => authService.revokePermission(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (data: CreateUserFormData) =>
      authService.register({
        email: data.email,
        password: data.password,
        displayName: data.displayName || undefined,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setShowAddUser(false)
      reset()
      toast.success("User added successfully", {
        description: `${variables.email} has been added to the system`,
      })
    },
    onError: () => {
      toast.error("Failed to add user", {
        description: "Please try again or contact support",
      })
    },
  })

  const handleTogglePermission = (user: User) => {
    if (user.canUpload) {
      revokePermissionMutation.mutate(user.uid)
    } else {
      grantPermissionMutation.mutate(user.uid)
    }
  }

  const onSubmit = (data: CreateUserFormData) => {
    addUserMutation.mutate(data)
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === "admin") {
      return "bg-red-500/20 text-red-400 border-red-500/30"
    }
    return "bg-primary/20 text-primary border-primary/30"
  }

  const getRoleDescription = (user: User) => {
    if (user.role === "admin") {
      return "Full access including user management"
    }
    return user.canUpload ? "Can upload and manage knowledge base files" : "Read-only access to chat"
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
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
            {users.length} users
          </span>
          <Button
            onClick={() => setShowAddUser(!showAddUser)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6 p-4 bg-background/50 border border-border/50 rounded-lg">
          <h3 className="text-sm font-semibold text-foreground mb-4">Add New User</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
              <Input
                type="email"
                {...register("email")}
                placeholder="user@example.com"
                className="bg-input border-border text-foreground"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password *</label>
              <Input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="bg-input border-border text-foreground"
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Name (Optional)</label>
              <Input
                type="text"
                {...register("displayName")}
                placeholder="John Doe"
                className="bg-input border-border text-foreground"
              />
              {errors.displayName && (
                <p className="text-xs text-destructive mt-1">{errors.displayName.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={addUserMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowAddUser(false)
                  reset()
                }}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
            {addUserMutation.isError && (
              <p className="text-xs text-destructive">
                Failed to add user. Please try again.
              </p>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users yet. Click "Add User" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.uid}
              className="flex items-center justify-between p-4 bg-background/50 border border-border/30 rounded-lg hover:border-border/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                  {user.displayName && (
                    <span className="text-xs text-muted-foreground">({user.displayName})</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{getRoleDescription(user)}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded border ${getRoleBadgeColor(user.role)}`}>
                  {user.role.toUpperCase()}
                </span>
                {user.role !== "admin" && (
                  <Button
                    onClick={() => handleTogglePermission(user)}
                    disabled={grantPermissionMutation.isPending || revokePermissionMutation.isPending}
                    size="sm"
                    variant="ghost"
                    className={user.canUpload ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"}
                  >
                    {grantPermissionMutation.isPending || revokePermissionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : user.canUpload ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Revoke
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Grant
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Permissions:</p>
        <ul className="space-y-1 text-xs">
          <li>
            • <span className="text-foreground font-medium">Admin:</span> Full access including user management
          </li>
          <li>
            • <span className="text-foreground font-medium">Upload Permission:</span> Can upload and manage knowledge base files
          </li>
          <li>
            • <span className="text-foreground font-medium">User:</span> Read-only access to chat
          </li>
        </ul>
      </div>
    </Card>
  )
}
