import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Force TypeScript to refresh types
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // İlk admin kullanıcısını oluştur
  const hashedPassword = await bcrypt.hash('admin123!', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hazarhome.com' },
    update: {},
    create: {
      email: 'admin@hazarhome.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin kullanıcısı oluşturuldu:', {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role
  })

  // Ek admin kullanıcısı (isteğe bağlı)
  const moderatorUser = await prisma.user.upsert({
    where: { email: 'moderator@hazarhome.com' },
    update: {},
    create: {
      email: 'moderator@hazarhome.com',
      name: 'Moderator User',
      password: await bcrypt.hash('moderator123!', 12),
      role: 'MODERATOR',
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Moderator kullanıcısı oluşturuldu:', {
    id: moderatorUser.id,
    email: moderatorUser.email,
    role: moderatorUser.role
  })

  console.log('🎉 Seeding tamamlandı!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding hatası:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
