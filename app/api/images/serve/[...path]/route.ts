// app/api/images/serve/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    console.log('🔍 Image serve request started')
    const { path: pathArray } = await params
    
    console.log('📥 Requested path array:', pathArray)
    
    if (!pathArray || pathArray.length === 0) {
      console.log('❌ No path provided')
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Normalize path separators in each path segment
    const normalizedPathArray = pathArray.map(segment => segment.replace(/\\/g, '/'))
    console.log('🔧 Normalized path array:', normalizedPathArray)

    // Construct file path with normalized separators
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const filePath = path.join(uploadsDir, ...normalizedPathArray)
    
    console.log('📁 Project root:', process.cwd())
    console.log('📁 Uploads directory:', uploadsDir)
    console.log('📁 Looking for file:', filePath)
    
    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(filePath)
    console.log('🔒 Security check - normalized path:', normalizedPath)
    console.log('🔒 Security check - uploads dir:', uploadsDir)
    console.log('🔒 Security check - starts with uploads?', normalizedPath.startsWith(uploadsDir))
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      console.log('❌ Security: Invalid path')
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

    // Check if file exists
    try {
      await fs.access(filePath)
      console.log('✅ File exists:', filePath)
    } catch {
      console.log('❌ File not found:', filePath)
      
      // List directory contents for debugging
      try {
        const dirPath = path.dirname(filePath)
        console.log('📂 Checking directory:', dirPath)
        const files = await fs.readdir(dirPath)
        console.log('📂 Directory contents:', files)
        
        // Also check parent directory
        const parentDir = path.dirname(dirPath)
        console.log('📂 Checking parent directory:', parentDir)
        const parentFiles = await fs.readdir(parentDir)
        console.log('📂 Parent directory contents:', parentFiles)
        
      } catch (dirError) {
        console.log('📂 Directory read error:', dirError)
        
        // Check if furniture directory exists
        try {
          const furnitureDir = path.join(uploadsDir, 'furniture')
          console.log('📂 Checking furniture directory:', furnitureDir)
          const furnitureFiles = await fs.readdir(furnitureDir)
          console.log('📂 Furniture directory contents:', furnitureFiles)
        } catch (furnitureError) {
          console.log('📂 Furniture directory error:', furnitureError)
        }
      }
      
      return NextResponse.json({ 
        error: 'File not found',
        requestedPath: filePath,
        pathArray: pathArray
      }, { status: 404 })
    }

    // Read file
    console.log('📖 Reading file:', filePath)
    const file = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    console.log('📄 File extension:', ext)
    console.log('📏 File size:', file.length, 'bytes')
    
    // Determine content type
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon'
    }[ext] || 'application/octet-stream'

    console.log('✅ Serving file successfully:', filePath, 'as', contentType)

    // Return file with proper headers
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': file.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': `"${Buffer.from(filePath).toString('base64')}"`,
        'Last-Modified': new Date().toUTCString()
      }
    })
  } catch (error) {
    console.error('❌ Image serving error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}