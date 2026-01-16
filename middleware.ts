import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Sadece /admin ile başlayan rotaları koru
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = token.role as string
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR']
    
    if (!validRoles.includes(userRole)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // 2. Hassas API rotalarını koru (örneğin sadece admin işlemlerini yapanlar)
  // GET istekleri genellikle public olabilir (ürün listeleme vb.), POST/PUT/DELETE admin gerektirebilir.
  // Burada basitlik adına sadece /api/setup, /api/cleanup gibi hassas endpointleri kontrol edebiliriz
  // veya API rotalarında yetkilendirmeyi endpoint içinde yapmayı tercih edebilirsiniz.
  // Şimdilik sadece /api/setup ve /api/cleanup korumalı kalsın.
  if (pathname.startsWith('/api/setup') || pathname.startsWith('/api/cleanup')) {
     const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
     if (!token) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Sadece /admin ve korumak istediğimiz belirli API rotaları için middleware çalışsın
    '/admin/:path*',
    '/api/setup/:path*',
    '/api/cleanup/:path*',
    // Diğer tüm rotalar (shop, public api, statik dosyalar) middleware'e hiç girmesin
  ],
}
