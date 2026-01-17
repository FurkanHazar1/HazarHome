
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(process.cwd(), 'public');

async function main() {
  console.log('Starting image compression and migration...');
  
  // Get all images
  const images = await prisma.image.findMany();
  console.log(`Found ${images.length} images in database.`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const image of images) {
    if (!image.filePath) {
      console.warn(`Skipping Image ID ${image.imageId}: No file path.`);
      continue;
    }

    // Normalize path to handle potential database inconsistencies
    // Removing leading slash if present to make it relative to public/
    let relativePath = image.filePath;
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }
    
    const fullPath = path.join(UPLOADS_DIR, relativePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (e) {
      console.warn(`File not found: ${fullPath} (Image ID: ${image.imageId})`);
      errorCount++;
      continue;
    }

    // Check extension
    const ext = path.extname(fullPath).toLowerCase();
    const isJpegOrPng = ['.jpg', '.jpeg', '.png'].includes(ext);
    
    if (!isJpegOrPng) {
      if (ext === '.webp') {
        // console.log(`Skipping ${relativePath}, already WebP.`);
        skippedCount++;
      } else {
        console.log(`Skipping ${relativePath}, unsupported extension: ${ext}`);
        skippedCount++;
      }
      continue;
    }

    // Define new path
    const dir = path.dirname(fullPath);
    const nameWithoutExt = path.basename(fullPath, ext);
    const newFileName = `${nameWithoutExt}.webp`;
    const newFullPath = path.join(dir, newFileName);
    
    // Determine new relative path for DB
    // We strictly use forward slashes for DB paths
    const dirRelative = path.dirname(relativePath);
    const newRelativePath = path.join(dirRelative, newFileName).split(path.sep).join('/');

    console.log(`Processing: ${relativePath} -> ${newRelativePath}`);

    try {
      // Compress and convert
      // Using metadata to get dimensions if needed, but simple resize is requested
      
      await sharp(fullPath)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(newFullPath);

      // Get new stats
      const stats = await fs.stat(newFullPath);

      // Update DB
      await prisma.image.update({
        where: { imageId: image.imageId },
        data: {
          fileName: newFileName,
          filePath: newRelativePath,
          fileType: 'image/webp',
          fileSize: stats.size,
        }
      });

      // Delete old file
      await fs.unlink(fullPath);
      processedCount++;

    } catch (err) {
      console.error(`Failed to process ${fullPath}:`, err);
      errorCount++;
      // Try to clean up new file if it was created but DB update failed
      try {
        await fs.unlink(newFullPath);
      } catch (cleanupErr) {
        // Ignore
      }
    }
  }

  console.log('------------------------------------------------');
  console.log(`Summary:`);
  console.log(`Processed (Converted & DB Updated): ${processedCount}`);
  console.log(`Skipped (Already WebP or other): ${skippedCount}`);
  console.log(`Errors (File not found or conversion failed): ${errorCount}`);
  console.log('------------------------------------------------');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
