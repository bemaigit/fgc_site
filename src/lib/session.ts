import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function isAuthenticated() {
  const session = await getSession()
  return !!session
}

export async function hasRole(role: string) {
  const session = await getSession()
  if (!session?.user?.role) return false
  return session.user.role === role
}

export async function isAdmin() {
  const session = await getSession()
  if (!session?.user?.role) return false
  return session.user.role === 'admin'
}
