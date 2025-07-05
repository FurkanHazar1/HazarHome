// app/api/upload/route.ts - Image Upload API
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Dosya seçilmedi'
      }, { status: 400 })
    }

    const uploadedImages = []
    
    for (const file of files) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({
          success: false,
          error: `${file.name} geçerli bir görsel dosyası değil`
        }, { status: 400 })
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          error: `${file.name} dosyası çok büyük (max 10MB)`
        }, { status: 400 })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = path.extname(file.name)
      const fileName = `${timestamp}-${randomString}${fileExtension}`
      
      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'furniture')
      await mkdir(uploadDir, { recursive: true })
      
      // Save file
      const filePath = path.join(uploadDir, fileName)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      
      // Add to database via Images API
      const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          filePath: `/uploads/furniture/${fileName}`,
          fileSize: file.size,
          fileType: file.type.split('/')[1],
          originalFileName: file.name,
          altText: `Mobilya görseli - ${file.name}`,
          isActive: true
        })
      })
      
      const imageData = await imageResponse.json()
      
      if (imageData.success) {
        uploadedImages.push({
          imageId: imageData.data.imageId,
          fileName: imageData.data.fileName,
          filePath: imageData.data.filePath,
          fileSize: imageData.data.fileSize,
          fileType: imageData.data.fileType,
          originalFileName: file.name
        })
      } else {
        // If database save fails, you might want to delete the uploaded file
        console.error('Database save failed:', imageData.error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedImages.length} görsel başarıyla yüklendi`,
      data: uploadedImages
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Dosya yükleme sırasında hata oluştu'
    }, { status: 500 })
  }
}