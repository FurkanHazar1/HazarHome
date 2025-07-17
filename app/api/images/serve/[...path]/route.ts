// app/api/images/serve/[...path]/route.ts - Updated with Category-Based Path Support
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { normalizeFilePath, generateLegacyPaths, isNewStructurePath } from '@/lib/image-utils'

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

/**
 * Generate possible file paths for both new category-based and legacy formats
 */
function generatePossiblePaths(uploadsDir: string, normalizedPath: string): string[] {
  const pathsToTry: string[] = []
  
  // 1. Direct path (as requested)
  pathsToTry.push(path.join(uploadsDir, normalizedPath))
  
  // 2. Add uploads prefix if missing
  if (!normalizedPath.startsWith('uploads/')) {
    pathsToTry.push(path.join(uploadsDir, 'uploads', normalizedPath))
  }
  
  // 3. Check if this follows new structure
  if (isNewStructurePath(normalizedPath)) {
    // This is already a new structure path, try as-is
    pathsToTry.push(path.join(uploadsDir, normalizedPath))
  } else {
    // Try to map to new structure patterns
    const pathParts = normalizedPath.split('/')
    
    // New structure patterns:
    // furniture/category/id_name/main.jpg
    // furniture/category/id_name/gallery/1.jpg
    // furniture/category/id_name/thumbnails/main_thumb.jpg
    // furniture-sets/category/id_name/main.jpg
    
    if (pathParts.length >= 3) {
      const [itemTypeOrUploads, possibleCategory, possibleIdName, ...rest] = pathParts
      
      // Skip if first part is 'uploads'
      const actualParts = itemTypeOrUploads === 'uploads' ? pathParts.slice(1) : pathParts
      
      if (actualParts.length >= 3) {
        const [itemType, category, idName, ...fileParts] = actualParts
        
        // Check if this looks like new structure
        if ((itemType === 'furniture' || itemType === 'furniture-sets') && 
            category && idName && idName.includes('_')) {
          
          // This should be new structure, try as-is
          pathsToTry.push(path.join(uploadsDir, actualParts.join('/')))
          
          // Also try with uploads prefix
          pathsToTry.push(path.join(uploadsDir, 'uploads', actualParts.join('/')))
        }
      }
    }
  }
  
  // 4. Legacy paths support
  const legacyPaths = generateLegacyPaths(normalizedPath)
  legacyPaths.forEach(legacyPath => {
    pathsToTry.push(path.join(uploadsDir, legacyPath))
  })
  
  // 5. Try old color-based structure patterns (for backward compatibility)
  const pathParts = normalizedPath.split('/')
  if (pathParts.length >= 2) {
    const fileName = pathParts[pathParts.length - 1]
    const parentDir = pathParts.slice(0, -1).join('/')
    
    // Check if this looks like a legacy color-based filename
    const colorPattern = /^color_(\d+)_([^_]+)_(\d+)\./
    const match = fileName.match(colorPattern)
    
    if (match) {
      // Try legacy furniture paths
      pathsToTry.push(path.join(uploadsDir, 'furniture', parentDir, fileName))
      pathsToTry.push(path.join(uploadsDir, 'furnituresets', parentDir, fileName))
      
      // Try without color prefix for even older legacy
      const legacyFileName = fileName.replace(colorPattern, `${match[3]}.${fileName.split('.').pop()}`)
      pathsToTry.push(path.join(uploadsDir, 'furniture', parentDir, legacyFileName))
    }
    
    // Try old structure patterns
    if (parentDir.startsWith('furniture_')) {
      pathsToTry.push(path.join(uploadsDir, 'furniture', parentDir, fileName))
    }
    
    if (parentDir.startsWith('furnitureset_')) {
      pathsToTry.push(path.join(uploadsDir, 'furnituresets', parentDir, fileName))
    }
  }
  
  // 6. Additional legacy patterns
  // Try with different base directories
  const additionalBaseDirs = ['furniture', 'furnituresets', 'furniture-sets']
  additionalBaseDirs.forEach(baseDir => {
    pathsToTry.push(path.join(uploadsDir, baseDir, normalizedPath))
    pathsToTry.push(path.join(uploadsDir, 'uploads', baseDir, normalizedPath))
  })
  
  // 7. Try normalized path variations
  const normalizedClean = normalizeFilePath(normalizedPath)
  if (normalizedClean !== normalizedPath) {
    pathsToTry.push(path.join(uploadsDir, normalizedClean))
    pathsToTry.push(path.join(uploadsDir, 'uploads', normalizedClean))
  }
  
  // Remove duplicates while preserving order
  return [...new Set(pathsToTry)]
}

/**
 * Log path attempts for debugging
 */
function logPathAttempts(normalizedPath: string, pathsToTry: string[], foundPath?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Image serve request:', normalizedPath)
    console.log('📁 Paths tried:', pathsToTry.length)
    
    if (foundPath) {
      console.log('✅ Found at:', foundPath)
    } else {
      console.log('❌ File not found in any location')
      console.log('🔍 First 5 paths tried:')
      pathsToTry.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p}`)
      })
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    
    // Validate and normalize path
    const { isValid, normalizedPath, error } = normalizeAndValidatePath(pathArray)
    
    if (!isValid) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // Construct file paths
    const uploadsDir = path.join(process.cwd(), 'uploads')
    
    // Check if uploads directory exists
    try {
      await fs.access(uploadsDir)
    } catch {
      return NextResponse.json({ 
        error: 'Uploads directory not found' 
      }, { status: 404 })
    }

    // Generate all possible paths to try
    const pathsToTry = generatePossiblePaths(uploadsDir, normalizedPath)
    
    // Security check for each path
    const resolvedUploadsDir = path.resolve(uploadsDir)
    let foundPath: string | null = null
    let fileBuffer: Buffer | null = null
    
    for (const filePath of pathsToTry) {
      try {
        // Security check - ensure file is within uploads directory
        const resolvedPath = path.resolve(filePath)
        
        if (!resolvedPath.startsWith(resolvedUploadsDir)) {
          continue // Skip paths outside uploads directory
        }
        
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          // Check if client has cached version
          const clientETag = request.headers.get('if-none-match')
          const serverETag = `"${Buffer.from(filePath + stats.size).toString('base64').substring(0, 32)}"`
          
          if (clientETag === serverETag) {
            return new NextResponse(null, { status: 304 })
          }
          
          // Read file
          fileBuffer = await fs.readFile(filePath)
          foundPath = filePath
          break
        }
      } catch {
        // Continue to next path
      }
    }

    // Log attempts for debugging
    logPathAttempts(normalizedPath, pathsToTry, foundPath || undefined)

    if (!foundPath || !fileBuffer) {
      // File not found in any location
      if (process.env.NODE_ENV === 'development') {
        try {
          const dirContents = await fs.readdir(uploadsDir, { recursive: true })
          
          // Look for similar files
          const fileName = normalizedPath.split('/').pop()
          const similarFiles = dirContents.filter((file: string) => 
            typeof file === 'string' && fileName && file.toLowerCase().includes(fileName.toLowerCase().split('.')[0])
          )
          
          return NextResponse.json({ 
            error: 'File not found',
            debug: {
              requestedPath: normalizedPath,
              searchedPaths: pathsToTry.slice(0, 10),
              uploadsDir,
              availableFiles: dirContents.slice(0, 20),
              similarFiles: similarFiles.slice(0, 10),
              isNewStructure: isNewStructurePath(normalizedPath)
            }
          }, { status: 404 })
        } catch {
          // Fallback error response
        }
      }
      
      return NextResponse.json({ 
        error: 'File not found'
      }, { status: 404 })
    }

    return createImageResponse(fileBuffer, foundPath)

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