import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔒 Middleware checking path:', pathname)

  // Public routes - always allow
  if (isPublicRoute(pathname)) {
    console.log('✅ Public route, allowing access')
    return NextResponse.next()
  }

  // Get token from request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  console.log('🎫 Token found:', !!token)
  if (token) {
    console.log('👤 User role:', token?.role)
  }

  // Check if route needs protection
  if (pathname.startsWith('/admin') || (pathname.startsWith('/api/') && !isPublicApiRoute(pathname))) {
    // No token - redirect to login
    if (!token) {
      console.log('❌ No token, redirecting to login')
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Check role
    const userRole = token.role as string
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR']
    
    if (!validRoles.includes(userRole)) {
      console.log('❌ Invalid role, access denied')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('✅ Valid token and role, allowing access')
  }

  return NextResponse.next()
}

// Public routes that don't need authentication
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/auth',                           // Auth pages
    '/product-detail-furniture',       // Furniture product pages
    '/product-detail-furniture-set',   // Furniture set product pages
  ]
  
  // Ana sayfa ayrı kontrol
  if (pathname === '/') {
    return true
  }
  
  // Kategori sayfaları public (menu kategorileri)
  if (pathname.match(/^\/(uclu-koltuklar|kose-koltuklar|berjerler|tv-uniteleri|sehpalar|yataklar|komodinler|gardiroplar|sifonyer|makyaj-masalari|yemek-masalari|konsol-ve-vitrinler|oturma-odasi-takimlari|yemek-odasi-takimlari|yatak-odasi-takimlari)$/)) {
    return true
  }
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

// Public API routes that don't need authentication
function isPublicApiRoute(pathname: string): boolean {
  const publicRoutes = [
    '/api/auth',           // NextAuth.js routes
    '/api/images/serve',   // Public image serving
    '/api/test-db',        // Database test route
    '/api/products',       // Products API - public for testing
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

// Middleware sadece bu rotaları kontrol etsin
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
