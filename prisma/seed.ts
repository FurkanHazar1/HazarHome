import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Admin kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash('hazar2344', 10)
  const adminEmail = 'furkanhazar@hazarhome.com'
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true
    },
    create: {
      email: adminEmail,
      name: 'Furkan Hazar',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin kullanıcısı hazır:', adminEmail)

  // 2. Kategorileri oluştur
  console.log('📂 Kategoriler oluşturuluyor...')

  const mainCategories = [
    { name: 'Oturma Odası', path: '/oturma-odasi', subs: ['Üçlü Koltuklar', 'İkili Koltuklar', 'Köşe Koltuklar', 'Berjer Koltuklar', 'TV Üniteleri', 'Sehpalar'] },
    { name: 'Yemek Odası', path: '/yemek-odasi', subs: ['Yemek Masaları', 'Yemek Sandalyeleri', 'Konsol ve Vitrinler'] },
    { name: 'Yatak Odası', path: '/yatak-odasi', subs: ['Yataklar', 'Gardıroplar', 'Komodinler', 'Makyaj Masaları', 'Şifonyerler'] }
  ]

  for (const cat of mainCategories) {
    const mainCat = await prisma.category.upsert({
      where: { categoryId: 0 }, // Fake ID for upsert logic search
      where_custom: { categoryName: cat.name }, // Prisma doesn't support this directly in upsert, using simple logic instead
      create: {
        categoryName: cat.name,
        categoryLevel: 1,
        categoryPath: cat.path,
        isActive: true
      },
      update: {}
    } as any).catch(async () => {
       // Fallback: If exists, skip. If not, create.
       const exists = await prisma.category.findFirst({ where: { categoryName: cat.name }})
       if (!exists) {
         return await prisma.category.create({
           data: { categoryName: cat.name, categoryLevel: 1, categoryPath: cat.path, isActive: true }
         })
       }
       return exists
    })

    for (const sub of cat.subs) {
      const subExists = await prisma.category.findFirst({ where: { categoryName: sub, parentId: mainCat.categoryId }})
      if (!subExists) {
        await prisma.category.create({
          data: {
            categoryName: sub,
            categoryLevel: 2,
            categoryPath: `${cat.path}/${sub.toLowerCase().replace(/\s+/g, '-')}`,
            parentId: mainCat.categoryId,
            isActive: true
          }
        })
      }
    }
    console.log(`✅ ${cat.name} ve alt kategorileri hazır.`)
  }

  // 3. Renkler
  const colors = [
    { name: 'Beyaz', code: '#FFFFFF' },
    { name: 'Siyah', code: '#000000' },
    { name: 'Gri', code: '#808080' },
    { name: 'Kahverengi', code: '#8B4513' },
    { name: 'Krem', code: '#F5F5DC' }
  ]

  for (const color of colors) {
    await prisma.color.upsert({
      where: { colorName: color.name },
      update: { colorCode: color.code },
      create: { colorName: color.name, colorCode: color.code, isActive: true }
    })
  }
  console.log('✅ Renkler hazır.')

  console.log('🎉 Seeding tamamlandı! Şimdi hazarhome.com/auth/login adresinden giriş yapabilirsiniz.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })