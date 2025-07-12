// app/api/images/serve/[...path]/route.ts - Fixed Version
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * Normalize and validate path
 */
function normalizeAndValidatePath(pathArray: string[]): { 
  isValid: boolean
  normalizedPath: string
  error?: string 
} {
  if (!pathArray || pathArray.length === 0) {
    return { isValid: false, normalizedPath: '', error: 'Path is required' }
  }

  // Decode and normalize each segment
  const normalizedSegments = pathArray.map(segment => {
    // Decode URI component
    const decoded = decodeURIComponent(segment)
    
    // Convert Windows separators to Unix
    const normalized = decoded.replace(/\\/g, '/')
    
    // Split by '/' and filter empty parts
    return normalized.split('/').filter(part => part.length > 0)
  }).flat()

  // Security check - prevent directory traversal
  for (const segment of normalizedSegments) {
    if (segment === '..' || segment === '.' || segment.includes('..')) {
      return { 
        isValid: false, 
        normalizedPath: '', 
        error: 'Directory traversal not allowed' 
      }
    }
  }

  return {
    isValid: true,
    normalizedPath: normalizedSegments.join('/'),
    error: undefined
  }
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff'
  }

  return contentTypes[ext] || 'application/octet-stream'
}

/**
 * Create optimized image response with proper headers
 */
function createImageResponse(buffer: Buffer, filePath: string): NextResponse {
  const contentType = getContentType(filePath)
  const etag = `"${Buffer.from(filePath + buffer.length).toString('base64').substring(0, 32)}"`
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': etag,
      'Last-Modified': new Date().toUTCString(),
      'Accept-Ranges': 'bytes'
    }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    console.log('🔍 Image serve request started')
    const { path: pathArray } = await params
    
    console.log('📥 Requested path array:', pathArray)

    // Validate and normalize path
    const { isValid, normalizedPath, error } = normalizeAndValidatePath(pathArray)
    
    if (!isValid) {
      console.log('❌ Path validation failed:', error)
      return NextResponse.json({ error }, { status: 400 })
    }

    console.log('🔧 Normalized path:', normalizedPath)

    // Construct file paths
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const requestedFilePath = path.join(uploadsDir, normalizedPath)
    
    console.log('📁 Project root:', process.cwd())
    console.log('📁 Uploads directory:', uploadsDir)
    console.log('📁 Looking for file:', requestedFilePath)
    
    // Security check - ensure file is within uploads directory
    const resolvedPath = path.resolve(requestedFilePath)
    const resolvedUploadsDir = path.resolve(uploadsDir)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.log('❌ Security: Path outside uploads directory')
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir)
      console.log('✅ Uploads directory exists')
    } catch {
      console.log('❌ Uploads directory does not exist!')
      return NextResponse.json({ error: 'Uploads directory not found' }, { status: 404 })
    }

    // Try to find and serve the file
    const pathsToTry = [
      requestedFilePath,
      // Alternative: add uploads prefix if missing
      path.join(uploadsDir, 'uploads', normalizedPath),
      // Alternative: try in furniture subdirectory
      path.join(uploadsDir, 'furniture', normalizedPath)
    ]

    for (const filePath of pathsToTry) {
      try {
        console.log('🔄 Trying path:', filePath)
        
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          console.log('✅ File found:', filePath)
          
          // Check if client has cached version
          const clientETag = request.headers.get('if-none-match')
          const serverETag = `"${Buffer.from(filePath + stats.size).toString('base64').substring(0, 32)}"`
          
          if (clientETag === serverETag) {
            console.log('📦 Serving from client cache (304)')
            return new NextResponse(null, { status: 304 })
          }
          
          // Read and serve file
          const fileBuffer = await fs.readFile(filePath)
          console.log('✅ File served successfully:', filePath, 'Size:', fileBuffer.length)
          
          return createImageResponse(fileBuffer, filePath)
        }
      } catch {
        // Continue to next path
        console.log('❌ Path not found:', filePath)
      }
    }

    // File not found in any location
    console.log('❌ File not found in any location')
    
    // In development, provide helpful debug info
    if (process.env.NODE_ENV === 'development') {
      try {
        const dirContents = await fs.readdir(uploadsDir, { recursive: true })
        console.log('📂 Available files in uploads:', dirContents.slice(0, 10))
        
        return NextResponse.json({ 
          error: 'File not found',
          debug: {
            requestedPath: normalizedPath,
            searchedPaths: pathsToTry,
            availableFiles: dirContents.slice(0, 20)
          }
        }, { status: 404 })
      } catch {
        // Fallback error response
      }
    }
    
    return NextResponse.json({ 
      error: 'File not found'
    }, { status: 404 })

  } catch (error) {
    console.error('❌ Image serving error:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : undefined
    }, { status: 500 })
  }
}