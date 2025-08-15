import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    
    // Güvenlik kontrolü
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Path'i birleştir ve güvenlik kontrolü yap
    const requestedPath = pathSegments.join('/')
    
    // Path traversal saldırılarını engellemek için
    if (requestedPath.includes('..') || requestedPath.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Tam dosya yolunu oluştur
    const fullPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'images',
      requestedPath
    )

    // Dosyanın uploads/images klasörü içinde olduğundan emin ol
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'images')
    const resolvedPath = path.resolve(fullPath)
    const resolvedUploadsPath = path.resolve(uploadsPath)
    
    if (!resolvedPath.startsWith(resolvedUploadsPath)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Dosya var mı kontrol et
    try {
      const stats = await fs.stat(resolvedPath)
      if (!stats.isFile()) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Dosyayı oku
    const fileBuffer = await fs.readFile(resolvedPath)
    
    // MIME type'ı belirle
    const ext = path.extname(resolvedPath).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.gif':
        contentType = 'image/gif'
        break
    }

    // Response headers
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=86400') // 24 saat cache
    headers.set('Content-Length', fileBuffer.length.toString())

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Image serve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
