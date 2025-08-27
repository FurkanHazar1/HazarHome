// Kategori ID ve slug eşleştirme sistemi
// Veritabanındaki kategori yapısına göre sabit mapping

export interface CategoryMapping {
  id: number
  name: string
  slug: string
  level: number
  parentId: number | null
  children?: CategoryMapping[]
}

// Ana Kategoriler (Level 1, Parent ID: null)
export const MAIN_CATEGORIES: CategoryMapping[] = [
  {
    id: 1,
    name: "Oturma Odası Takımları",
    slug: "oturma-odasi-takimlari", 
    level: 1,
    parentId: null
  },
  {
    id: 2,
    name: "Yemek Odası Takımları",
    slug: "yemek-odasi-takimlari",
    level: 1, 
    parentId: null
  },
  {
    id: 3,
    name: "Yatak Odası Takımları", 
    slug: "yatak-odasi-takimlari",
    level: 1,
    parentId: null
  }
]

// Alt Kategoriler (Level 2)
export const SUB_CATEGORIES: CategoryMapping[] = [
  // Oturma Odası Alt Kategorileri (Parent ID: 1)
  {
    id: 4,
    name: "Üçlü Koltuklar",
    slug: "uclu-koltuklar",
    level: 2,
    parentId: 1
  },
  {
    id: 5, 
    name: "Köşe Koltuklar",
    slug: "kose-koltuklar",
    level: 2,
    parentId: 1
  },
  {
    id: 6,
    name: "Berjerler", 
    slug: "berjerler",
    level: 2,
    parentId: 1
  },
  {
    id: 7,
    name: "Tv Üniteleri",
    slug: "tv-uniteleri", 
    level: 2,
    parentId: 1
  },
  {
    id: 8,
    name: "Sehpalar",
    slug: "sehpalar",
    level: 2, 
    parentId: 1
  },
  
  // Yatak Odası Alt Kategorileri (Parent ID: 3)
  {
    id: 9,
    name: "Yataklar",
    slug: "yataklar",
    level: 2,
    parentId: 3
  },
  {
    id: 10,
    name: "Komodinler", 
    slug: "komodinler",
    level: 2,
    parentId: 3
  },
  {
    id: 11,
    name: "Gardıroplar",
    slug: "gardiroplar",
    level: 2,
    parentId: 3
  },
  {
    id: 12,
    name: "Şifonyer",
    slug: "sifonyer",
    level: 2,
    parentId: 3
  },
  {
    id: 13,
    name: "Makyaj Masaları",
    slug: "makyaj-masalari",
    level: 2,
    parentId: 3
  },
  
  // Yemek Odası Alt Kategorileri (Parent ID: 2)
  {
    id: 14,
    name: "Yemek Masaları",
    slug: "yemek-masalari", 
    level: 2,
    parentId: 2
  },
  {
    id: 15,
    name: "Konsol ve Vitrinler",
    slug: "konsol-ve-vitrinler",
    level: 2,
    parentId: 2
  }
]

// Tüm kategoriler birleştirilmiş
export const ALL_CATEGORIES: CategoryMapping[] = [...MAIN_CATEGORIES, ...SUB_CATEGORIES]

// Hiyerarşik kategori yapısı
export const CATEGORY_TREE: CategoryMapping[] = MAIN_CATEGORIES.map(mainCat => ({
  ...mainCat,
  children: SUB_CATEGORIES.filter(subCat => subCat.parentId === mainCat.id)
}))

// Yardımcı fonksiyonlar

/**
 * Kategori ID'ye göre kategori bilgisini getirir
 */
export function getCategoryById(categoryId: number): CategoryMapping | undefined {
  return ALL_CATEGORIES.find(cat => cat.id === categoryId)
}

/**
 * Slug'a göre kategori bilgisini getirir 
 */
export function getCategoryBySlug(slug: string): CategoryMapping | undefined {
  return ALL_CATEGORIES.find(cat => cat.slug === slug)
}

/**
 * Ana kategori ID'sini döndürür (level 1 ise kendisi, level 2 ise parent'ı)
 */
export function getMainCategoryId(categoryId: number): number | null {
  const category = getCategoryById(categoryId)
  if (!category) return null
  
  if (category.level === 1) {
    return category.id
  } else if (category.level === 2) {
    return category.parentId
  }
  
  return null
}

/**
 * Ana kategori slug'ını döndürür
 */
export function getMainCategorySlug(categoryId: number): string | null {
  const mainCategoryId = getMainCategoryId(categoryId)
  if (!mainCategoryId) return null
  
  const mainCategory = getCategoryById(mainCategoryId)
  return mainCategory?.slug || null
}

/**
 * Kategori ID'den slug'a çevirir
 */
export function categoryIdToSlug(categoryId: number): string | null {
  const category = getCategoryById(categoryId)
  return category?.slug || null
}

/**
 * Slug'dan kategori ID'ye çevirir
 */
export function categorySlugToId(slug: string): number | null {
  const category = getCategoryBySlug(slug)
  return category?.id || null
}

/**
 * Breadcrumb yapısı oluşturur
 */
export function buildCategoryBreadcrumb(categoryId: number): CategoryMapping[] {
  const category = getCategoryById(categoryId)
  if (!category) return []
  
  const breadcrumb: CategoryMapping[] = []
  
  // Eğer alt kategoriyse, önce ana kategoriyi ekle
  if (category.level === 2 && category.parentId) {
    const parentCategory = getCategoryById(category.parentId)
    if (parentCategory) {
      breadcrumb.push(parentCategory)
    }
  }
  
  // Mevcut kategoriyi ekle
  breadcrumb.push(category)
  
  return breadcrumb
}

/**
 * Alt kategorileri getirir
 */
export function getSubCategories(parentCategoryId: number): CategoryMapping[] {
  return SUB_CATEGORIES.filter(cat => cat.parentId === parentCategoryId)
}

/**
 * Ana kategorileri getirir
 */
export function getMainCategories(): CategoryMapping[] {
  return MAIN_CATEGORIES
}

/**
 * Legacy kategori slug'larını yeni sisteme çevirir
 */
export function convertLegacyCategorySlug(legacySlug: string): string | null {
  // Eski slug formatlarını yeni sisteme çevir
  const legacyMappings: { [key: string]: string } = {
    'oturma-odasi': 'oturma-odasi-takimlari',
    'yatak-odasi': 'yatak-odasi-takimlari', 
    'yemek-odasi': 'yemek-odasi-takimlari',
    'koltuk': 'uclu-koltuklar',
    'tv-unitesi': 'tv-uniteleri',
    'sehpa': 'sehpalar'
  }
  
  return legacyMappings[legacySlug] || legacySlug
}

/**
 * Statik veri uyumluluğu için kategori filtresi
 */
export function isValidCategorySlug(slug: string): boolean {
  return ALL_CATEGORIES.some(cat => cat.slug === slug)
}
