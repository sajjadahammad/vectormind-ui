import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "./firebase"

export const firebaseAuth = {
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const token = await userCredential.user.getIdToken()
    return { user: userCredential.user, token }
  },

  async register(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const token = await userCredential.user.getIdToken()
    return { user: userCredential.user, token }
  },

  async logout() {
    await signOut(auth)
  },

  async getIdToken() {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken()
    }
    return null
  },
}
