import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes - always allow
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Get token from request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Check if route needs protection
  if (pathname.startsWith('/admin') || (pathname.startsWith('/api/') && !isPublicApiRoute(pathname))) {
    // No token - redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Check role
    const userRole = token.role as string
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR']
    
    if (!validRoles.includes(userRole)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  return NextResponse.next()
}

// Public routes that don't need authentication
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',                   // Home page
    '/auth',              // Auth pages
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

// Public API routes that don't need authentication
function isPublicApiRoute(pathname: string): boolean {
  const publicRoutes = [
    '/api/auth',           // NextAuth.js routes
    '/api/images/serve',   // Public image serving
    '/api/test-db',        // Database test route
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/categories/:path*",
    "/api/colors/:path*", 
    "/api/furniture/:path*",
    "/api/furniture-sets/:path*",
    "/api/properties/:path*",
    "/api/images/:path*",
    "/api/setup/:path*",
    "/api/cleanup/:path*"
  ]
}
