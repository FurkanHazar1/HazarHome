import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash('admin123!', 10)
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

  // Moderator kullanıcısı oluştur
  const hashedModeratorPassword = await bcrypt.hash('moderator123!', 10)
  const moderatorUser = await prisma.user.upsert({
    where: { email: 'moderator@hazarhome.com' },
    update: {},
    create: {
      email: 'moderator@hazarhome.com',
      name: 'Moderator User',
      password: hashedModeratorPassword,
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

  // Kategorileri oluştur
  console.log('📂 Kategori oluşturuluyor...')

  // Ana kategoriler
  const mainCategories = [
    {
      categoryName: 'Oturma Odası',
      description: 'Modern ve şık oturma odası takımları',
      categoryLevel: 1,
      categoryPath: '/oturma-odasi',
      isActive: true
    },
    {
      categoryName: 'Yemek Odası',
      description: 'Zarif ve fonksiyonel yemek odası takımları',
      categoryLevel: 1,
      categoryPath: '/yemek-odasi',
      isActive: true
    },
    {
      categoryName: 'Yatak Odası',
      description: 'Rahat ve modern yatak odası takımları',
      categoryLevel: 1,
      categoryPath: '/yatak-odasi',
      isActive: true
    }
  ]

  const createdMainCategories: any = {}

  for (const categoryData of mainCategories) {
    const category = await prisma.category.create({
      data: categoryData
    })
    createdMainCategories[categoryData.categoryName] = category
    console.log(`✅ Ana kategori oluşturuldu: ${category.categoryName}`)
  }

  // Alt kategoriler - Oturma Odası
  const oturmaOdasiSubCategories = [
    { categoryName: 'Üçlü Koltuklar', categoryPath: '/oturma-odasi/uclu-koltuklar' },
    { categoryName: 'İkili Koltuklar', categoryPath: '/oturma-odasi/ikili-koltuklar' },
    { categoryName: 'Köşe Koltuklar', categoryPath: '/oturma-odasi/kose-koltuklar' },
    { categoryName: 'Berjer Koltuklar', categoryPath: '/oturma-odasi/berjer-koltuklar' },
    { categoryName: 'TV Üniteleri', categoryPath: '/oturma-odasi/tv-uniteleri' },
    { categoryName: 'Sehpalar', categoryPath: '/oturma-odasi/sehpalar' }
  ]

  for (const subCatData of oturmaOdasiSubCategories) {
    const subCategory = await prisma.category.create({
      data: {
        categoryName: subCatData.categoryName,
        description: `${subCatData.categoryName} kategorisi`,
        categoryLevel: 2,
        categoryPath: subCatData.categoryPath,
        isActive: true,
        parentId: createdMainCategories['Oturma Odası'].categoryId
      }
    })
    console.log(`✅ Alt kategori oluşturuldu: ${subCategory.categoryName}`)
  }

  // Alt kategoriler - Yemek Odası
  const yemekOdasiSubCategories = [
    { categoryName: 'Yemek Masaları', categoryPath: '/yemek-odasi/yemek-masalari' },
    { categoryName: 'Yemek Sandalyeleri', categoryPath: '/yemek-odasi/yemek-sandalyeleri' },
    { categoryName: 'Konsol ve Vitrinler', categoryPath: '/yemek-odasi/konsol-vitrin' }
  ]

  for (const subCatData of yemekOdasiSubCategories) {
    const subCategory = await prisma.category.create({
      data: {
        categoryName: subCatData.categoryName,
        description: `${subCatData.categoryName} kategorisi`,
        categoryLevel: 2,
        categoryPath: subCatData.categoryPath,
        isActive: true,
        parentId: createdMainCategories['Yemek Odası'].categoryId
      }
    })
    console.log(`✅ Alt kategori oluşturuldu: ${subCategory.categoryName}`)
  }

  // Alt kategoriler - Yatak Odası
  const yatakOdasiSubCategories = [
    { categoryName: 'Yataklar', categoryPath: '/yatak-odasi/yataklar' },
    { categoryName: 'Gardıroplar', categoryPath: '/yatak-odasi/gardiroplar' },
    { categoryName: 'Komodinler', categoryPath: '/yatak-odasi/komodinler' },
    { categoryName: 'Makyaj Masaları', categoryPath: '/yatak-odasi/makyaj-masalari' },
    { categoryName: 'Şifonyerler', categoryPath: '/yatak-odasi/sifonyerler' }
  ]

  for (const subCatData of yatakOdasiSubCategories) {
    const subCategory = await prisma.category.create({
      data: {
        categoryName: subCatData.categoryName,
        description: `${subCatData.categoryName} kategorisi`,
        categoryLevel: 2,
        categoryPath: subCatData.categoryPath,
        isActive: true,
        parentId: createdMainCategories['Yatak Odası'].categoryId
      }
    })
    console.log(`✅ Alt kategori oluşturuldu: ${subCategory.categoryName}`)
  }

  // Renkler oluştur
  console.log('🎨 Renkler oluşturuluyor...')
  
  const colors = [
    { colorName: 'Beyaz', colorCode: '#FFFFFF' },
    { colorName: 'Siyah', colorCode: '#000000' },
    { colorName: 'Gri', colorCode: '#808080' },
    { colorName: 'Kahverengi', colorCode: '#8B4513' },
    { colorName: 'Krem', colorCode: '#F5F5DC' },
    { colorName: 'Antrasit', colorCode: '#2F2F2F' },
    { colorName: 'Bej', colorCode: '#F5F5DC' },
    { colorName: 'Lacivert', colorCode: '#000080' }
  ]

  for (const colorData of colors) {
    const color = await prisma.color.upsert({
      where: { colorName: colorData.colorName },
      update: {},
      create: colorData
    })
    console.log(`✅ Renk oluşturuldu: ${color.colorName}`)
  }

  // Özellikler oluştur
  console.log('🔧 Özellikler oluşturuluyor...')
  
  const properties = [
    { propertyName: 'Malzeme', propertyType: 'text', description: 'Ürünün yapıldığı malzeme' },
    { propertyName: 'Boyut', propertyType: 'text', description: 'Ürünün boyutları' },
    { propertyName: 'Ağırlık', propertyType: 'number', description: 'Ürünün ağırlığı (kg)' },
    { propertyName: 'Garanti', propertyType: 'text', description: 'Garanti süresi' },
    { propertyName: 'Kişilik', propertyType: 'number', description: 'Kaç kişilik olduğu' }
  ]

  for (const propertyData of properties) {
    const property = await prisma.property.upsert({
      where: { propertyName: propertyData.propertyName },
      update: {},
      create: propertyData
    })
    console.log(`✅ Özellik oluşturuldu: ${property.propertyName}`)
  }

  console.log('🎉 Seeding tamamlandı!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
