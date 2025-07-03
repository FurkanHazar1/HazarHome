// Test için örnek veri ekleme scripti
// Bu kodu terminal'de veya test dosyasında kullanabilirsiniz

// 1. Önce kategoriler, renkler ve özellikler eklememiz gerekiyor

// app/api/setup/route.ts - Test verileri için
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Örnek kategoriler ekle
    const categories = await prisma.category.createMany({
      data: [
        {
          categoryName: 'Oturma Odası',
          description: 'Oturma odası mobilyaları',
          categoryLevel: 1,
          categoryPath: '/oturma-odasi'
        },
        {
          categoryName: 'Yatak Odası', 
          description: 'Yatak odası mobilyaları',
          categoryLevel: 1,
          categoryPath: '/yatak-odasi'
        },
        {
          categoryName: 'Koltuklar',
          description: 'Tek ve çift koltuklar',
          categoryLevel: 2,
          categoryPath: '/oturma-odasi/koltuklar'
        }
      ],
      skipDuplicates: true
    })

    // Örnek renkler ekle
    const colors = await prisma.color.createMany({
      data: [
        { colorName: 'Beyaz', colorCode: '#FFFFFF' },
        { colorName: 'Siyah', colorCode: '#000000' },
        { colorName: 'Kahverengi', colorCode: '#8B4513' },
        { colorName: 'Gri', colorCode: '#808080' },
        { colorName: 'Lacivert', colorCode: '#000080' }
      ],
      skipDuplicates: true
    })

    // Örnek özellikler ekle
    const properties = await prisma.property.createMany({
      data: [
        { propertyName: 'Malzeme', propertyType: 'text', description: 'Mobilyanın yapıldığı malzeme' },
        { propertyName: 'Boyut', propertyType: 'text', description: 'Mobilyanın ölçüleri' },
        { propertyName: 'Ağırlık', propertyType: 'number', description: 'Mobilyanın ağırlığı (kg)' },
        { propertyName: 'Garanti', propertyType: 'text', description: 'Garanti süresi' },
        { propertyName: 'Marka', propertyType: 'text', description: 'Mobilya markası' }
      ],
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      message: 'Test verileri eklendi',
      data: { categories, colors, properties }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error
    }, { status: 500 })
  }
}

// 2. Mobilya ekleme için örnek request'ler

// Basit mobilya ekleme örneği
const basicFurnitureExample = {
  furnitureName: "Modern Koltuk Takımı",
  furnitureType: "Koltuk",
  categoryId: 1, // Oturma Odası
  description: "3+2+1 modern koltuk takımı, yüksek kalite kumaş",
  price: 15000.00,
  isActive: true
}

// Renkli mobilya ekleme örneği  
const coloredFurnitureExample = {
  furnitureName: "Ergonomik Çalışma Koltuğu",
  furnitureType: "Ofis Koltuğu", 
  categoryId: 1,
  description: "Ayarlanabilir yükseklik, lomber destek",
  price: 2500.00,
  colorIds: [1, 2, 4], // Beyaz, Siyah, Gri
  properties: [
    { propertyId: 1, propertyValue: "Deri + Metal" },
    { propertyId: 2, propertyValue: "60x60x120 cm" },
    { propertyId: 3, propertyValue: "15" },
    { propertyId: 4, propertyValue: "2 Yıl" }
  ]
}

// Görselli mobilya ekleme örneği
const furnitureWithImagesExample = {
  furnitureName: "Lüks Yatak Odası Takımı",
  furnitureType: "Yatak Odası Takımı",
  categoryId: 2, // Yatak Odası
  description: "6 parça yatak odası takımı, masif ahşap",
  price: 25000.00,
  colorIds: [3, 5], // Kahverengi, Lacivert
  properties: [
    { propertyId: 1, propertyValue: "Masif Meşe" },
    { propertyId: 2, propertyValue: "200x160x220 cm" },
    { propertyId: 4, propertyValue: "5 Yıl" },
    { propertyId: 5, propertyValue: "İstikbal" }
  ],
  images: [
    {
      fileName: "yatak-odasi-1.jpg",
      filePath: "/uploads/yatak-odasi-1.jpg",
      fileSize: 2048576,
      fileType: "jpg",
      description: "Yatak odası takımı ana görsel",
      altText: "Lüks yatak odası takımı",
      width: 1920,
      height: 1080,
      sortOrder: 1,
      imageType: "main_image"
    },
    {
      fileName: "yatak-odasi-2.jpg", 
      filePath: "/uploads/yatak-odasi-2.jpg",
      fileSize: 1536000,
      fileType: "jpg",
      description: "Detay görsel",
      altText: "Yatak odası detay",
      width: 1024,
      height: 768,
      sortOrder: 2,
      imageType: "detail"
    }
  ]
}

// 3. Test fonksiyonları

// Curl komutları ile test
const curlExamples = `
# 1. Test verilerini ekle
curl -X POST http://localhost:3000/api/setup \\
  -H "Content-Type: application/json"

# 2. Form verilerini getir
curl http://localhost:3000/api/furniture/add

# 3. Basit mobilya ekle
curl -X POST http://localhost:3000/api/furniture/add \\
  -H "Content-Type: application/json" \\
  -d '{
    "furnitureName": "Test Koltuk",
    "furnitureType": "Koltuk",
    "categoryId": 1,
    "description": "Test açıklaması",
    "price": 5000.00
  }'

# 4. Özellikleri olan mobilya ekle
curl -X POST http://localhost:3000/api/furniture/add \\
  -H "Content-Type: application/json" \\
  -d '{
    "furnitureName": "Premium Koltuk",
    "furnitureType": "Koltuk",
    "categoryId": 1,
    "description": "Premium kalite koltuk",
    "price": 8000.00,
    "colorIds": [1, 2],
    "properties": [
      {"propertyId": 1, "propertyValue": "Gerçek Deri"},
      {"propertyId": 2, "propertyValue": "180x90x85 cm"}
    ]
  }'
`

// 4. JavaScript ile test fonksiyonu
async function testFurnitureAdd() {
  try {
    // Önce test verilerini ekle
    const setupResponse = await fetch('/api/setup', {
      method: 'POST'
    })
    console.log('Setup:', await setupResponse.json())

    // Mobilya ekle
    const furnitureResponse = await fetch('/api/furniture/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(basicFurnitureExample)
    })
    
    const result = await furnitureResponse.json()
    console.log('Mobilya ekleme sonucu:', result)

    if (result.success) {
      console.log('✅ Mobilya başarıyla eklendi!')
      console.log('Mobilya ID:', result.data.furnitureId)
    } else {
      console.log('❌ Hata:', result.error)
    }
  } catch (error) {
    console.error('Test hatası:', error)
  }
}

// Bu fonksiyonu tarayıcı konsolunda çalıştırabilirsiniz
// testFurnitureAdd()