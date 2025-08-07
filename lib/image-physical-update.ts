// lib/image-physical-update.ts - Enhanced Physical File Update System
import path from 'path'
import fs from 'fs/promises'
import { 
  generateCategoryBasedPath, 
  generateThumbnailPath,
  createImageMetadata,
  parseImageMetadata,
  savePhysicalFile,
  deletePhysicalFile,
  normalizeFilePath,
  THUMBNAIL_CONFIGS
} from '@/lib/image-utils'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'

export interface PhysicalUpdatePlan {
  imageId: number
  currentPath: string
  newPath: string
  newFileName: string
  updateType: 'rename' | 'move' | 'regenerate_thumbnail'
  sortOrder: number
  imageType: 'main' | 'gallery' | 'thumbnail'
}

export interface PhysicalUpdateResult {
  success: boolean
  updatedFiles: string[]
  errors: string[]
  rollbackPlan?: PhysicalUpdatePlan[]
}

/**
 * Generate comprehensive physical update plan for furniture images
 */
export async function generatePhysicalUpdatePlan(
  furnitureId: number,
  furnitureName: string,
  categoryName: string,
  imageUpdates: Array<{
    imageId: number
    currentPath: string
    newSortOrder: number
    newImageType: 'main' | 'gallery' | 'thumbnail'
    isNew?: boolean
  }>
): Promise<PhysicalUpdatePlan[]> {
  const updatePlan: PhysicalUpdatePlan[] = []
  
  // Sort by new sort order to ensure proper sequencing
  const sortedUpdates = imageUpdates.sort((a, b) => a.newSortOrder - b.newSortOrder)
  
  for (const update of sortedUpdates) {
    const { imageId, currentPath, newSortOrder, newImageType, isNew = false } = update
    
    if (isNew) continue // Skip new images, they're handled separately
    
    // Parse current file info
    const currentFileInfo = path.parse(currentPath)
    const extension = currentFileInfo.ext
    
    // Generate new path based on type and sort order
    let newFileName: string
    let newSubDirectory: string
    
    switch (newImageType) {
      case 'main':
        newFileName = `main${extension}`
        newSubDirectory = ''
        break
        
      case 'gallery':
        newFileName = `${newSortOrder}${extension}`
        newSubDirectory = 'gallery'
        break
        
      case 'thumbnail':
        if (newSortOrder === 0) {
          newFileName = `main_thumb${extension}`
        } else {
          newFileName = `${newSortOrder}_thumb${extension}`
        }
        newSubDirectory = 'thumbnails'
        break
        
      default:
        newFileName = `${newSortOrder}${extension}`
        newSubDirectory = 'gallery'
    }
    
    // Generate new full path
    const itemDirName = `${furnitureId}_${furnitureName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
    const basePath = path.join('uploads', 'furniture', categoryName.toLowerCase().replace(/\s+/g, '-'), itemDirName)
    const newDirectory = newSubDirectory ? path.join(basePath, newSubDirectory) : basePath
    const newPath = path.join(newDirectory, newFileName)
    
    // Normalize paths for comparison
    const normalizedCurrentPath = normalizeFilePath(currentPath)
    const normalizedNewPath = normalizeFilePath(newPath)
    
    // Only add to plan if path actually changes
    if (normalizedCurrentPath !== normalizedNewPath) {
      let updateType: 'rename' | 'move' | 'regenerate_thumbnail' = 'rename'
      
      // Determine update type
      if (path.dirname(normalizedCurrentPath) !== path.dirname(normalizedNewPath)) {
        updateType = 'move'
      }
      
      if (newImageType === 'thumbnail') {
        updateType = 'regenerate_thumbnail'
      }
      
      updatePlan.push({
        imageId,
        currentPath: normalizedCurrentPath,
        newPath: normalizedNewPath,
        newFileName,
        updateType,
        sortOrder: newSortOrder,
        imageType: newImageType
      })
    }
  }
  
  return updatePlan
}

/**
 * Execute physical file updates with rollback capability
 */
export async function executePhysicalUpdates(
  updatePlan: PhysicalUpdatePlan[]
): Promise<PhysicalUpdateResult> {
  const result: PhysicalUpdateResult = {
    success: true,
    updatedFiles: [],
    errors: [],
    rollbackPlan: []
  }
  
  // Create rollback plan before making changes
  const rollbackPlan: PhysicalUpdatePlan[] = updatePlan.map(plan => ({
    ...plan,
    currentPath: plan.newPath,
    newPath: plan.currentPath,
    newFileName: path.basename(plan.currentPath)
  }))
  
  result.rollbackPlan = rollbackPlan
  
  try {
    // Phase 1: Create temporary files to avoid conflicts
    const tempFiles: { [key: string]: string } = {}
    
    for (const plan of updatePlan) {
      try {
        // Check if source file exists
        try {
          await fs.access(plan.currentPath)
        } catch {
          result.errors.push(`Source file not found: ${plan.currentPath}`)
          continue
        }
        
        // Create temporary file
        const tempPath = `${plan.currentPath}.temp_${Date.now()}`
        await fs.copyFile(plan.currentPath, tempPath)
        tempFiles[plan.currentPath] = tempPath
        
      } catch (error) {
        result.errors.push(`Failed to create temp file for ${plan.currentPath}: ${error}`)
        result.success = false
      }
    }
    
    // Phase 2: Create target directories
    const directories = new Set<string>()
    for (const plan of updatePlan) {
      directories.add(path.dirname(plan.newPath))
    }
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true })
      } catch (error) {
        result.errors.push(`Failed to create directory ${dir}: ${error}`)
        result.success = false
      }
    }
    
    // Phase 3: Move files to new locations
    for (const plan of updatePlan) {
      try {
        const tempPath = tempFiles[plan.currentPath]
        if (!tempPath) continue
        
        if (plan.updateType === 'regenerate_thumbnail') {
          // For thumbnails, regenerate from original
          await regenerateThumbnail(plan, tempPath)
        } else {
          // For regular files, just move
          await fs.copyFile(tempPath, plan.newPath)
        }
        
        result.updatedFiles.push(plan.newPath)
        
      } catch (error) {
        result.errors.push(`Failed to move ${plan.currentPath} to ${plan.newPath}: ${error}`)
        result.success = false
      }
    }
    
    // Phase 4: Delete original files and temp files
    for (const plan of updatePlan) {
      try {
        // Delete original file
        await fs.unlink(plan.currentPath)
        
        // Delete temp file
        const tempPath = tempFiles[plan.currentPath]
        if (tempPath) {
          try {
            await fs.unlink(tempPath)
          } catch {
            // Ignore temp file deletion errors
          }
        }
        
      } catch (error) {
        result.errors.push(`Failed to cleanup ${plan.currentPath}: ${error}`)
      }
    }
    
    // Phase 5: Cleanup empty directories
    await cleanupEmptyDirectories(updatePlan.map(p => path.dirname(p.currentPath)))
    
  } catch (error) {
    result.errors.push(`Critical error during file operations: ${error}`)
    result.success = false
  }
  
  return result
}

/**
 * Regenerate thumbnail from original image
 */
async function regenerateThumbnail(
  plan: PhysicalUpdatePlan, 
  sourcePath: string
): Promise<void> {
  // Determine thumbnail config based on filename
  let configKey = 'gallery_thumb'
  if (plan.newFileName.includes('main_thumb')) {
    configKey = 'main_thumb'
  }
  
  const config = THUMBNAIL_CONFIGS[configKey]
  if (!config) {
    throw new Error(`Unknown thumbnail config: ${configKey}`)
  }
  
  // Generate thumbnail
  const thumbnailBuffer = await sharp(sourcePath)
    .resize(config.width, config.height, { 
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: config.quality })
    .toBuffer()
  
  // Save thumbnail
  await fs.writeFile(plan.newPath, thumbnailBuffer)
}

/**
 * Cleanup empty directories after file moves
 */
async function cleanupEmptyDirectories(directories: string[]): Promise<void> {
  const uniqueDirs = [...new Set(directories)]
  
  for (const dir of uniqueDirs) {
    try {
      const files = await fs.readdir(dir)
      if (files.length === 0) {
        await fs.rmdir(dir)
        
        // Try to remove parent directory if empty
        const parentDir = path.dirname(dir)
        try {
          const parentFiles = await fs.readdir(parentDir)
          if (parentFiles.length === 0) {
            await fs.rmdir(parentDir)
          }
        } catch {
          // Ignore parent directory cleanup errors
        }
      }
    } catch {
      // Ignore directory cleanup errors
    }
  }
}

/**
 * Rollback physical file changes
 */
export async function rollbackPhysicalUpdates(
  rollbackPlan: PhysicalUpdatePlan[]
): Promise<PhysicalUpdateResult> {
  console.log('🔄 Rolling back physical file changes...')
  return executePhysicalUpdates(rollbackPlan)
}

/**
 * Update database with new file paths
 */
export async function updateDatabasePaths(
  updatePlan: PhysicalUpdatePlan[],
  furnitureId: number,
  furnitureName: string,
  categoryName: string
): Promise<void> {
  for (const plan of updatePlan) {
    // Create new metadata
    const metadata = createImageMetadata(
      'furniture',
      furnitureId,
      categoryName,
      furnitureName,
      plan.imageType,
      plan.newFileName,
      plan.sortOrder
    )
    
    // Update database
    await prisma.image.update({
      where: { imageId: plan.imageId },
      data: {
        fileName: plan.newFileName,
        filePath: plan.newPath,
        description: metadata,
        sortOrder: plan.sortOrder
      }
    })
    
    // Update furniture image relationship
    await prisma.furnitureImage.updateMany({
      where: { 
        furnitureId,
        imageId: plan.imageId 
      },
      data: {
        sortOrder: plan.sortOrder,
        imageType: plan.imageType === 'main' ? 'main_image' : plan.imageType
      }
    })
  }
}

/**
 * Main function: Complete image reorganization for furniture
 */
export async function reorganizeFurnitureImages(
  furnitureId: number,
  furnitureName: string,
  categoryName: string,
  imageUpdates: Array<{
    imageId: number
    currentPath: string
    newSortOrder: number
    newImageType: 'main' | 'gallery' | 'thumbnail'
  }>
): Promise<{
  success: boolean
  message: string
  updatedFiles: string[]
  errors: string[]
}> {
  try {
    console.log(`🔄 Starting image reorganization for furniture ${furnitureId}`)
    
    // Generate update plan
    const updatePlan = await generatePhysicalUpdatePlan(
      furnitureId,
      furnitureName,
      categoryName,
      imageUpdates
    )
    
    if (updatePlan.length === 0) {
      return {
        success: true,
        message: 'No physical file updates needed',
        updatedFiles: [],
        errors: []
      }
    }
    
    console.log(`📋 Generated update plan with ${updatePlan.length} operations`)
    
    // Execute physical updates
    const physicalResult = await executePhysicalUpdates(updatePlan)
    
    if (!physicalResult.success) {
      // Attempt rollback
      if (physicalResult.rollbackPlan) {
        console.log('❌ Physical updates failed, attempting rollback...')
        await rollbackPhysicalUpdates(physicalResult.rollbackPlan)
      }
      
      return {
        success: false,
        message: 'Physical file updates failed',
        updatedFiles: physicalResult.updatedFiles,
        errors: physicalResult.errors
      }
    }
    
    // Update database with new paths
    await updateDatabasePaths(updatePlan, furnitureId, furnitureName, categoryName)
    
    console.log(`✅ Successfully reorganized ${physicalResult.updatedFiles.length} files`)
    
    return {
      success: true,
      message: `Successfully reorganized ${physicalResult.updatedFiles.length} image files`,
      updatedFiles: physicalResult.updatedFiles,
      errors: physicalResult.errors
    }
    
  } catch (error) {
    console.error('❌ Image reorganization failed:', error)
    
    return {
      success: false,
      message: 'Image reorganization failed',
      updatedFiles: [],
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}