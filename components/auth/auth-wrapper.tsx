"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthWrapperProps {
  children: React.ReactNode
  requiredRole?: string[]
}

export function AuthWrapper({ children, requiredRole }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Role kontrolü
    if (requiredRole && session?.user?.role) {
      if (!requiredRole.includes(session.user.role)) {
        router.push("/auth/unauthorized")
        return
      }
    }
  }, [session, status, router, requiredRole])

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Yükleniyor...</h2>
          <p className="text-white/60">Oturum kontrol ediliyor</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return null // Will redirect
  }

  // Role check failed
  if (requiredRole && session?.user?.role && !requiredRole.includes(session.user.role)) {
    return null // Will redirect
  }

  return <>{children}</>
}
