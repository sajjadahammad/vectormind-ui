import apiClient from "@/lib/api-client"
import { firebaseAuth } from "@/lib/firebase-auth"

interface FirebaseLoginPayload {
  email: string
  password: string
}

interface FirebaseRegisterPayload {
  email: string
  password: string
  displayName?: string
}

interface LoginResponse {
  user: {
    uid: string
    email: string
    displayName: string
    role: string
    canUpload: boolean
    createdAt: string
  }
  token: string
}

interface User {
  uid: string
  email: string
  displayName: string
  role: string
  canUpload: boolean
  createdAt: string
}

export const authService = {
  async login(payload: FirebaseLoginPayload) {
    const { user: firebaseUser, token } = await firebaseAuth.login(payload.email, payload.password)

    const response = await apiClient.post<LoginResponse>("/auth/login", {
      token,
      firebaseUid: firebaseUser.uid,
    })

    // Store the token in localStorage
    localStorage.setItem("authToken", token)

    return response.data
  },

  async register(payload: FirebaseRegisterPayload) {

    const response = await apiClient.post<{ user: User }>("/auth/register", {
      password: payload.password,
      email: payload.email,
      displayName: payload.displayName,
    })

    return response.data.user
  },

  async getCurrentUser() {
    const response = await apiClient.get<{ user: User }>("/auth/me")
    return response.data.user
  },

  async grantPermission(userId: string) {
    const response = await apiClient.post("/auth/grant-permission", { userId })
    return response.data
  },

  async revokePermission(userId: string) {
    const response = await apiClient.post("/auth/revoke-permission", { userId })
    return response.data
  },

  async listUsers() {
    const response = await apiClient.get<{ users: User[]; count: number }>("/auth/users")
    return response.data.users
  },

  async logout() {
    await firebaseAuth.logout()
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
  },
}
